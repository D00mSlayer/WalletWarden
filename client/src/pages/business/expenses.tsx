import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
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
import { Loader2, PlusCircle, MinusCircle, IndianRupee, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { format } from "date-fns";
import { useState } from "react";

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
          onValueChange={(value) => {
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
          onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
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

      <div className="space-y-2 max-h-[40vh] overflow-y-auto">
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

type ExpenseFormProps = {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
};

function ExpenseForm({ onSubmit, onCancel }: ExpenseFormProps) {
  const [isSharedExpense, setIsSharedExpense] = useState(false);
  const [shares, setShares] = useState<Share[]>([]);
  const [isAddingShare, setIsAddingShare] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertExpenseSchema),
    defaultValues: {
      category: "",
      amount: "",
      date: new Date().toISOString().split('T')[0],
      description: "",
      paidBy: "",
      payerName: "",
      paymentMethod: "",
    },
  });

  const handleAddShare = (share: Share) => {
    const totalShares = shares.reduce((sum, share) => sum + Number(share.amount), 0);
    const formAmount = Number(form.watch("amount"));

    if (totalShares + Number(share.amount) > formAmount) {
      toast({
        title: "Error",
        description: "Total shares cannot exceed the expense amount",
        variant: "destructive",
      });
      return;
    }

    setShares(prev => [...prev, share]);
    setIsAddingShare(false);
  };

  const removeShare = (index: number) => {
    setShares(prev => prev.filter((_, i) => i !== index));
  };

  const onFormSubmit = async (formData: any) => {
    try {
      if (isSharedExpense) {
        // Validate shared expense
        if (shares.length === 0) {
          toast({
            title: "Error",
            description: "Add at least one share for shared expenses",
            variant: "destructive",
          });
          return;
        }

        const totalShares = shares.reduce((sum, share) => sum + Number(share.amount), 0);
        const formAmount = Number(formData.amount);

        if (Math.abs(totalShares - formAmount) > 0.01) {
          toast({
            title: "Error",
            description: "Total shares must equal the expense amount",
            variant: "destructive",
          });
          return;
        }

        // Submit shared expense
        await onSubmit({
          ...formData,
          amount: formAmount,
          isSharedExpense: true,
          shares: shares
        });
      } else {
        // Validate regular expense
        if (!formData.paidBy) {
          toast({
            title: "Error",
            description: "Please select who paid the expense",
            variant: "destructive",
          });
          return;
        }

        if (formData.paidBy === "Other" && !formData.payerName) {
          toast({
            title: "Error",
            description: "Please enter the name of the person who paid",
            variant: "destructive",
          });
          return;
        }

        if (!formData.paymentMethod) {
          toast({
            title: "Error",
            description: "Please select a payment method",
            variant: "destructive",
          });
          return;
        }

        // Submit regular expense
        await onSubmit({
          ...formData,
          amount: Number(formData.amount),
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
  };

  return (
    <div className="flex flex-col h-[80vh]">
      <div className="flex-1 overflow-y-auto px-4">
        <form id="expenseForm" onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              className="mt-1.5"
              {...form.register("date")}
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={form.watch("category")}
              onValueChange={(value) => form.setValue("category", value)}
            >
              <SelectTrigger className="mt-1.5">
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
          </div>

          <div>
            <Label htmlFor="amount">Amount</Label>
            <div className="relative mt-1.5">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                className="pl-10"
                {...form.register("amount", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isShared"
              checked={isSharedExpense}
              onChange={(e) => {
                setIsSharedExpense(e.target.checked);
                if (!e.target.checked) {
                  setShares([]);
                }
              }}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="isShared">This is a shared expense</Label>
          </div>

          {!isSharedExpense ? (
            <>
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
                  <SelectTrigger className="mt-1.5">
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
              </div>

              {form.watch("paidBy") === "Other" && (
                <div>
                  <Label htmlFor="payerName">Person Name</Label>
                  <Input
                    id="payerName"
                    className="mt-1.5"
                    {...form.register("payerName")}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={form.watch("paymentMethod")}
                  onValueChange={(value) => form.setValue("paymentMethod", value)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select payment method" />
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
            </>
          ) : (
            <div className="space-y-4 border rounded-lg p-4">
              <ShareList
                shares={shares}
                onRemove={removeShare}
                totalAmount={Number(form.watch("amount") || 0)}
              />

              {isAddingShare ? (
                <ShareForm onSubmit={handleAddShare} />
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsAddingShare(true)}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Share
                </Button>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              className="mt-1.5"
              {...form.register("description")}
            />
          </div>
        </form>
      </div>

      <div className="sticky bottom-0 bg-white mt-4 pt-4 px-4 border-t flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" form="expenseForm">
          Add Expense
        </Button>
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
                {expense.shares?.map((share, index) => (
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

function ImportCSVDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setErrors([]);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const rows = text.split('\n')
          .map(row => row.split(',').map(cell => cell.trim()))
          .filter(row => row.length >= 7); // Ensure we have all required columns

        const response = await apiRequest(
          "POST",
          "/api/business/expenses/import-csv",
          { data: rows }
        );

        if (!response.ok) {
          throw new Error("Failed to import CSV");
        }

        const result = await response.json();

        if (result.errors.length > 0) {
          setErrors(result.errors);
          toast({
            title: "Import completed with errors",
            description: `Imported ${result.imported} records. ${result.errors.length} errors occurred.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Import successful",
            description: `Successfully imported ${result.imported} records.`,
          });
          onOpenChange(false);
        }

        queryClient.invalidateQueries({ queryKey: ["/api/business/expenses"] });
      } catch (error) {
        toast({
          title: "Import failed",
          description: error instanceof Error ? error.message : "Failed to import CSV",
          variant: "destructive",
        });
      } finally {
        setIsImporting(false);
      }
    };

    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Expenses from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with the following columns:
            <br />
            Category, Description, Total Cost (ignored), Paid by Me, Paid by Bina, Paid by Business, Notes
            <br />
            <br />
            Note: All expenses will be dated October 15, 2024 by default, unless a date is found in the Notes column (e.g. "Paid Jan 25 2025").
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="csvFile">Select CSV File</Label>
            <Input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isImporting}
            />
          </div>
          {isImporting && (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Importing...</span>
            </div>
          )}
          {errors.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-medium text-destructive">Import Errors:</h4>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {errors.map((error, index) => (
                  <p key={index} className="text-sm text-destructive">{error}</p>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Expenses() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const { data: expenses, isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/business/expenses"],
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
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

          <div className="flex gap-2">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg p-0">
                <DialogHeader className="px-4 py-2 border-b">
                  <DialogTitle>Add Expense</DialogTitle>
                </DialogHeader>
                <ExpenseForm
                  onSubmit={(data) => addExpenseMutation.mutateAsync(data)}
                  onCancel={() => setIsOpen(false)}
                />
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
          </div>
        </div>
      </header>

      <ImportCSVDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />

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