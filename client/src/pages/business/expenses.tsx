import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExpenseSchema, expenseCategories, paymentSources, paymentMethods, type Expense, type Share } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, PlusCircle, MinusCircle, IndianRupee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { format } from "date-fns";
import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import Papa from "papaparse";

function ImportCSV({ onImport }: { onImport: (data: any[]) => Promise<void> }) {
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    
    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          console.log("Parsed CSV:", results.data);
          
          if (results.data.length === 0) {
            toast({
              title: "Error",
              description: "No valid data found in CSV file",
              variant: "destructive",
            });
            return;
          }
          
          try {
            await onImport(results.data);
            toast({
              title: "Success",
              description: `Imported ${results.data.length} expense(s)`,
            });
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          } catch (error) {
            console.error("Import error:", error);
            toast({
              title: "Import failed",
              description: error instanceof Error ? error.message : "Unknown error",
              variant: "destructive",
            });
          }
        },
        error: (error) => {
          console.error("CSV parsing error:", error);
          toast({
            title: "Error",
            description: "Failed to parse CSV file",
            variant: "destructive",
          });
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
        ref={fileInputRef}
      />
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Upload className="h-4 w-4 mr-2" />
        )}
        Import Expenses
      </Button>
    </div>
  );
}

function ShareForm({ onSubmit }: { onSubmit: (share: Share) => void }) {
  const [formData, setFormData] = useState<Partial<Share>>({});
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.payerType || !formData.amount || !formData.paymentMethod) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.payerType === "Other" && !formData.payerName) {
      toast({
        title: "Error",
        description: "Please enter a name for 'Other' payer",
        variant: "destructive",
      });
      return;
    }

    onSubmit(formData as Share);
    setFormData({}); // Reset form
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Payer</Label>
        <Select
          value={formData.payerType}
          onValueChange={(value: typeof paymentSources[number]) => {
            setFormData(prev => ({
              ...prev,
              payerType: value,
              payerName: value === "Other" ? prev.payerName : undefined
            }));
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select payer" />
          </SelectTrigger>
          <SelectContent>
            {paymentSources.map((source) => (
              <SelectItem key={source} value={source}>
                {source}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {formData.payerType === "Other" && (
        <div>
          <Label>Person Name</Label>
          <Input
            value={formData.payerName || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, payerName: e.target.value }))}
            placeholder="Enter name"
          />
        </div>
      )}

      <div>
        <Label>Amount</Label>
        <div className="relative">
          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            type="number"
            step="0.01"
            className="pl-10"
            value={formData.amount || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
            placeholder="Enter amount"
          />
        </div>
      </div>

      <div>
        <Label>Payment Method</Label>
        <Select
          value={formData.paymentMethod}
          onValueChange={(value: typeof paymentMethods[number]) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select method" />
          </SelectTrigger>
          <SelectContent>
            {paymentMethods.map((method) => (
              <SelectItem key={method} value={method}>
                {method}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full">Add Share</Button>
    </form>
  );
}

function ExpenseForm({ onSubmit, onCancel }: { onSubmit: (data: any) => Promise<void>; onCancel: () => void }) {
  const [isSharedExpense, setIsSharedExpense] = useState(false);
  const [shares, setShares] = useState<Share[]>([]);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertExpenseSchema),
    defaultValues: {
      category: "",
      amount: "",
      date: new Date().toISOString().split('T')[0],
      description: "",
      paidBy: "Business", // Default to Business
      payerName: "",
      paymentMethod: "Cash", // Default to Cash
    },
  });

  // Watch the amount to update the shares remaining amount
  const amount = form.watch("amount");
  
  // Calculate total shares and remaining amount
  const totalShares = shares.reduce((sum, share) => sum + Number(share.amount), 0);
  const remainingAmount = Math.max(0, Number(amount || 0) - totalShares);
  const isSharesBalanced = Math.abs(totalShares - Number(amount || 0)) < 0.01;

  const addShare = (payer: typeof paymentSources[number], amount: number, method: typeof paymentMethods[number], payerName?: string) => {
    if (Number(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Share amount must be greater than zero",
        variant: "destructive",
      });
      return;
    }

    if (totalShares + Number(amount) > Number(form.watch("amount"))) {
      toast({
        title: "Error",
        description: "Total shares cannot exceed the expense amount",
        variant: "destructive",
      });
      return;
    }

    if (payer === "Other" && !payerName) {
      toast({
        title: "Missing name",
        description: "Please provide a name for 'Other'",
        variant: "destructive",
      });
      return;
    }

    setShares(prev => [
      ...prev, 
      { 
        payerType: payer, 
        amount: Number(amount), 
        paymentMethod: method,
        payerName: payer === "Other" ? payerName : undefined
      }
    ]);
  };

  const removeShare = (index: number) => {
    setShares(prev => prev.filter((_, i) => i !== index));
  };

  const handleFormSubmit = form.handleSubmit(async (data) => {
    console.log("Form submitted with data:", data);

    try {
      if (isSharedExpense) {
        if (shares.length === 0) {
          toast({
            title: "Missing shares",
            description: "Add at least one share for shared expenses",
            variant: "destructive",
          });
          return;
        }

        if (!isSharesBalanced) {
          toast({
            title: "Unbalanced shares",
            description: "Total shares must equal the expense amount",
            variant: "destructive",
          });
          return;
        }

        await onSubmit({
          category: data.category,
          amount: Number(data.amount),
          date: data.date,
          description: data.description || "",
          isSharedExpense: true,
          shares: shares.map(share => ({
            ...share,
            amount: Number(share.amount)
          }))
        });
      } else {
        if (!data.paidBy) {
          toast({
            title: "Missing payer",
            description: "Please select who paid",
            variant: "destructive",
          });
          return;
        }

        if (data.paidBy === "Other" && !data.payerName) {
          toast({
            title: "Missing name",
            description: "Please provide a name for 'Other' payer",
            variant: "destructive",
          });
          return;
        }

        await onSubmit({
          ...data,
          amount: Number(data.amount),
          isSharedExpense: false
        });
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Error",
        description: "Failed to submit expense",
        variant: "destructive",
      });
    }
  });

  // Quick way to add a personal share
  const handleQuickAddBusinessShare = () => {
    if (remainingAmount <= 0) return;
    addShare("Business", remainingAmount, "Cash");
  };

  // Quick way to add a business share
  const handleQuickAddPersonalShare = () => {
    if (remainingAmount <= 0) return;
    addShare("Personal", remainingAmount, "Cash");
  };

  return (
    <form onSubmit={handleFormSubmit} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Basic Expense Info */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              {...form.register("date")}
            />
            {form.formState.errors.date && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.date.message?.toString()}</p>
            )}
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={form.watch("category")}
              onValueChange={(value) => form.setValue("category", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.category && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.category.message?.toString()}</p>
            )}
          </div>

          <div>
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                className="pl-10"
                {...form.register("amount", { valueAsNumber: true })}
              />
            </div>
            {form.formState.errors.amount && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.amount.message?.toString()}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="isShared" 
              checked={isSharedExpense}
              onCheckedChange={(checked) => {
                setIsSharedExpense(checked === true);
                if (checked === false) {
                  setShares([]);
                }
              }}
            />
            <Label htmlFor="isShared" className="cursor-pointer">This is a shared expense</Label>
          </div>
        </div>

        {/* Individual Expense */}
        {!isSharedExpense ? (
          <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
            <h3 className="text-sm font-semibold">Payment Details</h3>
            
            <div>
              <Label htmlFor="paidBy">Paid By</Label>
              <Select
                value={form.watch("paidBy")}
                onValueChange={(value) => {
                  form.setValue("paidBy", value);
                  if (value !== "Other") {
                    form.setValue("payerName", "");
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select who paid" />
                </SelectTrigger>
                <SelectContent>
                  {paymentSources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.paidBy && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.paidBy.message?.toString()}</p>
              )}
            </div>

            {form.watch("paidBy") === "Other" && (
              <div>
                <Label htmlFor="payerName">Person Name</Label>
                <Input
                  id="payerName"
                  placeholder="Enter name"
                  {...form.register("payerName")}
                />
                {form.formState.errors.payerName && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.payerName.message?.toString()}</p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={form.watch("paymentMethod")}
                onValueChange={(value) => form.setValue("paymentMethod", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.paymentMethod && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.paymentMethod.message?.toString()}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold">Expense Shares</h3>
              <span className={isSharesBalanced ? "text-green-600 text-sm font-medium" : "text-red-600 text-sm font-medium"}>
                Remaining: ₹{remainingAmount.toFixed(2)}
              </span>
            </div>

            {/* Show added shares */}
            {shares.length > 0 && (
              <div className="space-y-2 mb-4">
                {shares.map((share, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-md bg-white">
                    <div>
                      <div className="font-medium">
                        {share.payerType === "Other" ? share.payerName : share.payerType}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ₹{share.amount.toFixed(2)} via {share.paymentMethod}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeShare(index)}
                      className="text-destructive"
                    >
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick buttons to add shares */}
            {remainingAmount > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleQuickAddBusinessShare}
                >
                  Add Business Share
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleQuickAddPersonalShare}
                >
                  Add Personal Share
                </Button>
              </div>
            )}

            {/* Share input form */}
            <div className="space-y-3 border rounded p-3 bg-white">
              <h4 className="text-sm font-medium">Add Custom Share</h4>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="sharePayerType">Payer</Label>
                  <Select
                    value={form.watch("paidBy")}
                    onValueChange={(value) => form.setValue("paidBy", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payer" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentSources.map((source) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {form.watch("paidBy") === "Other" && (
                  <div>
                    <Label htmlFor="sharePayerName">Person Name</Label>
                    <Input
                      id="sharePayerName"
                      placeholder="Enter name"
                      {...form.register("payerName")}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="shareAmount">Amount</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="shareAmount"
                      type="number"
                      step="0.01"
                      placeholder={`Max ${remainingAmount.toFixed(2)}`}
                      className="pl-10"
                      value={remainingAmount > 0 ? remainingAmount : ""}
                      onChange={(e) => {}}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="sharePaymentMethod">Payment Method</Label>
                  <Select
                    value={form.watch("paymentMethod")}
                    onValueChange={(value) => form.setValue("paymentMethod", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="button"
                  className="w-full"
                  disabled={remainingAmount <= 0}
                  onClick={() => {
                    const payer = form.watch("paidBy") as typeof paymentSources[number];
                    const method = form.watch("paymentMethod") as typeof paymentMethods[number];
                    const payerName = form.watch("payerName");
                    
                    addShare(payer, remainingAmount, method, payer === "Other" ? payerName : undefined);
                  }}
                >
                  Add Share
                </Button>
              </div>
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Input
            id="description"
            placeholder="Add details about this expense"
            {...form.register("description")}
          />
        </div>
      </div>

      <div className="sticky bottom-0 p-4 border-t flex justify-end gap-2 bg-white">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Add Expense
        </Button>
      </div>
    </form>
  );
}

function ShareList({ shares, onRemove, totalAmount }: { shares: Share[]; onRemove: (index: number) => void; totalAmount: number }) {
  const totalShares = shares.reduce((sum, share) => sum + Number(share.amount), 0);
  const remaining = Math.max(0, totalAmount - totalShares);

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm">
        <span className="font-medium">Expense Shares</span>
        <span className={remaining === 0 ? "text-green-600" : "text-red-600"}>
          Remaining: ₹{remaining.toFixed(2)}
        </span>
      </div>

      <div className="space-y-2">
        {shares.map((share, index) => (
          <div key={index} className="flex justify-between items-center p-3 border rounded-md">
            <div>
              <div className="font-medium">
                {share.payerType === "Other" ? share.payerName : share.payerType}
              </div>
              <div className="text-sm text-muted-foreground">
                ₹{share.amount} via {share.paymentMethod}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove(index)}
              className="text-destructive"
            >
              <MinusCircle className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExpenseCard({ expense }: { expense: Expense }) {
  const formattedDate = format(new Date(expense.date), "PPP");

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="text-sm text-muted-foreground">
          {formattedDate}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-2xl font-medium flex items-center">
              <IndianRupee className="h-4 w-4" />
              {expense.amount}
            </div>
            <div className="text-sm text-muted-foreground">{expense.category}</div>
          </div>

          {!expense.isSharedExpense ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium mb-1">Paid By</div>
                <div className="text-sm text-muted-foreground">
                  {expense.paidBy === "Other" ? expense.payerName : expense.paidBy}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Payment Method</div>
                <div className="text-sm text-muted-foreground">{expense.paymentMethod}</div>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-2">
                <span className="text-sm font-medium">Shared Expense</span>
              </div>
              <div className="space-y-2">
                {expense.shares?.map((share: any, index) => (
                  <div key={index} className="flex justify-between text-sm items-center">
                    <div>
                      <span>{share.payerType === "Other" ? share.payerName : share.payerType}</span>
                      <div className="text-xs text-muted-foreground">via {share.paymentMethod}</div>
                    </div>
                    <span className="text-muted-foreground flex items-center">
                      <IndianRupee className="h-3 w-3" />
                      {share.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {expense.description && (
            <div>
              <div className="text-sm font-medium mb-1">Description</div>
              <div className="text-sm text-muted-foreground">{expense.description}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Expenses() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const { data: expenses, isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/business/expenses"],
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Mutation called with data:", data);
      const res = await apiRequest("POST", "/api/business/expenses", data);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add expense");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business/expenses"] });
      toast({ title: "Expense added successfully" });
      setIsOpen(false);
    },
    onError: (error: Error) => {
      console.error("Mutation error:", error);
      toast({
        title: "Failed to add expense",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const groupedExpenses = expenses?.reduce((groups, expense) => {
    const group = groups[expense.category] || [];
    group.push(expense);
    return { ...groups, [expense.category]: group };
  }, {} as Record<string, Expense[]>) || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/business" className="text-gray-600 hover:text-gray-900">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-primary">Business Expenses</h1>
          </div>

          <div className="flex space-x-2">
            <Button onClick={() => setIsOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
            <ImportCSV onImport={async (csvData) => {
              const formattedData = csvData.map((row: any) => {
                // Expecting CSV with: date, category, amount, description, isSharedExpense, paidBy, paymentMethod, payerName (optional)
                return {
                  date: row.date || new Date().toISOString().split('T')[0],
                  category: row.category || "Other",
                  amount: Number(row.amount) || 0,
                  description: row.description || "",
                  isSharedExpense: row.isSharedExpense === "true" || false,
                  paidBy: row.paidBy || "Business",
                  paymentMethod: row.paymentMethod || "Cash",
                  payerName: row.payerName || "",
                  shares: row.shares ? JSON.parse(row.shares) : []
                };
              });

              console.log("Formatted import data:", formattedData);
              
              const results = await Promise.allSettled(
                formattedData.map(data => addExpenseMutation.mutateAsync(data))
              );
              
              const successful = results.filter(r => r.status === "fulfilled").length;
              const failed = results.filter(r => r.status === "rejected").length;
              
              if (failed > 0) {
                toast({
                  title: `Imported ${successful} of ${formattedData.length} expenses`,
                  description: `${failed} expenses failed to import`,
                  variant: "destructive",
                });
              } else {
                toast({
                  title: "Success",
                  description: `All ${successful} expenses imported successfully`,
                });
              }
            }} />
          </div>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-md w-[95%] p-0 h-[85vh] flex flex-col overflow-hidden">
              <DialogHeader className="px-4 py-3 border-b">
                <DialogTitle>Add Expense</DialogTitle>
              </DialogHeader>
              <div className="flex-1 flex flex-col overflow-hidden">
                <ExpenseForm
                  onSubmit={(data) => addExpenseMutation.mutateAsync(data)}
                  onCancel={() => setIsOpen(false)}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : Object.keys(groupedExpenses).length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No expenses recorded yet
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedExpenses).map(([category, expenses]) => (
              <div key={category}>
                <h2 className="text-lg font-semibold mb-4">{category}</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {expenses.map((expense) => (
                    <ExpenseCard
                      key={expense.id}
                      expense={expense}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}