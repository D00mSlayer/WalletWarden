import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertExpenseSchema,
  expenseCategories,
  paymentSources,
  paymentMethods,
  type Expense,
  type Share
} from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Loader2,
  PlusCircle,
  MinusCircle,
  Trash2,
  IndianRupee,
  Calendar,
  Users,
  Upload,
  X,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

function ExpenseForm({ onSubmit, defaultValues, onCancel }: any) {
  const [isSharedExpense, setIsSharedExpense] = useState(false);
  const [shares, setShares] = useState<Share[]>([]);
  const [shareForm, setShareForm] = useState<Partial<Share>>({
    payerType: undefined,
    amount: undefined,
    paymentMethod: undefined,
  });
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertExpenseSchema),
    defaultValues: {
      category: defaultValues?.category || "",
      amount: defaultValues?.amount || "",
      date: defaultValues?.date || format(new Date(), "yyyy-MM-dd"),
      description: defaultValues?.description || "",
      isSharedExpense: defaultValues?.isSharedExpense || false,
      paidBy: defaultValues?.paidBy || "",
      payerName: defaultValues?.payerName || "",
      paymentMethod: defaultValues?.paymentMethod || "",
      shares: defaultValues?.shares || [],
    },
  });

  const amount = form.watch("amount");
  const remainingAmount = isSharedExpense ?
    Number(amount || 0) - shares.reduce((sum, share) => sum + share.amount, 0) :
    0;

  const addShare = () => {
    if (!shareForm.payerType || !shareForm.paymentMethod || !shareForm.amount) {
      toast({
        title: "Error",
        description: "Please fill in all share details",
        variant: "destructive",
      });
      return false;
    }

    if (shareForm.payerType === "Other" && !shareForm.payerName) {
      toast({
        title: "Error",
        description: "Please enter a name for 'Other' payer",
        variant: "destructive",
      });
      return false;
    }

    const newShare = {
      payerType: shareForm.payerType,
      payerName: shareForm.payerName,
      amount: Number(shareForm.amount),
      paymentMethod: shareForm.paymentMethod
    } as Share;

    setShares(prevShares => [...prevShares, newShare]);

    // Reset form
    setShareForm({
      payerType: undefined,
      amount: undefined,
      paymentMethod: undefined,
      payerName: undefined
    });

    return true;
  };

  const removeShare = (index: number) => {
    const newShares = [...shares];
    newShares.splice(index, 1);
    setShares(newShares);
  };

  const handleSubmit = async (data: any) => {
    try {
      if (isSharedExpense) {
        if (shares.length === 0) {
          toast({
            title: "Error",
            description: "Add at least one share for shared expenses",
            variant: "destructive",
          });
          return;
        }

        const totalShares = shares.reduce((sum, share) => sum + share.amount, 0);

        if (Math.abs(totalShares - Number(data.amount)) > 0.01) {
          toast({
            title: "Error",
            description: "Total shares must equal the expense amount",
            variant: "destructive",
          });
          return;
        }


        const formattedData = {
          category: data.category,
          amount: Number(data.amount),
          date: data.date,
          description: data.description,
          isSharedExpense: true,
          shares: shares.map(share => ({
            ...share,
            amount: Number(share.amount)
          }))
        };

        await onSubmit(formattedData);
      } else {
        if (data.paidBy === "Other" && !data.payerName) {
          toast({
            title: "Error",
            description: "Person name is required when payer is 'Other'",
            variant: "destructive",
          });
          return;
        }

        const formattedData = {
          category: data.category,
          amount: Number(data.amount),
          date: data.date,
          description: data.description,
          isSharedExpense: false,
          paidBy: data.paidBy,
          payerName: data.payerName,
          paymentMethod: data.paymentMethod,
        };

        await onSubmit(formattedData);
      }
    } catch (error) {
      console.error("[ExpenseForm] Submission error:", error);
      toast({
        title: "Error",
        description: "Failed to submit expense",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
  }, [shares]);

  const updateShare = (index: number, field: keyof Share, value: any) => {
    const newShares = [...shares];
    newShares[index] = { ...newShares[index], [field]: value };
    setShares(newShares);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      <div className="space-y-4 max-h-[calc(80vh-8rem)] overflow-y-auto px-4 pb-4">
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
            onValueChange={(value) => form.setValue("category", value, { shouldValidate: true })}
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
          {form.formState.errors.category && (
            <p className="text-sm text-red-500 mt-1">{form.formState.errors.category.message as string}</p>
          )}
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
          {form.formState.errors.amount && (
            <p className="text-sm text-red-500 mt-1">{form.formState.errors.amount.message as string}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isShared"
            checked={isSharedExpense}
            onChange={(e) => {
              setIsSharedExpense(e.target.checked);
              if (e.target.checked) {
                form.setValue("paidBy", "", { shouldValidate: true });
                form.setValue("payerName", "", { shouldValidate: true });
                form.setValue("paymentMethod", "", { shouldValidate: true });
              } else {
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
                  form.setValue("paidBy", value, { shouldValidate: true });
                  if (value !== "Other") {
                    form.setValue("payerName", "", { shouldValidate: true });
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
              {form.formState.errors.paidBy && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.paidBy.message as string}</p>
              )}
            </div>

            {form.watch("paidBy") === "Other" && (
              <div>
                <Label htmlFor="payerName">Person Name</Label>
                <Input
                  id="payerName"
                  className="mt-1.5"
                  {...form.register("payerName")}
                />
                {form.formState.errors.payerName && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.payerName.message as string}</p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={form.watch("paymentMethod")}
                onValueChange={(value) => form.setValue("paymentMethod", value, { shouldValidate: true })}
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
              {form.formState.errors.paymentMethod && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.paymentMethod.message as string}</p>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <h3 className="font-medium">Expense Shares</h3>
              </div>
              <div className="text-sm">
                Remaining: <span className={remainingAmount === 0 ? "text-green-600" : "text-red-600"}>
                  ₹{remainingAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {shares.map((share, index) => (
                <div key={index} className="space-y-3 p-3 border rounded-md">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">
                          {share.payerType === "Other" ? share.payerName : share.payerType}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => removeShare(index)}
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        via {share.paymentMethod}
                      </div>
                      <div className="text-sm font-medium mt-2">
                        Amount: ₹{share.amount}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Share
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="p-4">
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="addSharePayerType">Payer</Label>
                      <Select
                        value={shareForm.payerType}
                        onValueChange={(value) => setShareForm({ ...shareForm, payerType: value })}
                      >
                        <SelectTrigger id="addSharePayerType" className="mt-1.5">
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

                    {shareForm.payerType === "Other" && (
                      <div>
                        <Label htmlFor="addSharePayerName">Payer Name</Label>
                        <Input
                          id="addSharePayerName"
                          placeholder="Enter name"
                          value={shareForm.payerName || ""}
                          onChange={(e) => setShareForm({ ...shareForm, payerName: e.target.value })}
                          className="mt-1.5"
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="addSharePaymentMethod">Payment Method</Label>
                      <Select
                        value={shareForm.paymentMethod}
                        onValueChange={(value) => setShareForm({ ...shareForm, paymentMethod: value })}
                      >
                        <SelectTrigger id="addSharePaymentMethod" className="mt-1.5">
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

                    <div>
                      <Label htmlFor="addShareAmount">Amount</Label>
                      <Input
                        id="addShareAmount"
                        type="number"
                        placeholder="Amount"
                        value={shareForm.amount || ""}
                        onChange={(e) => setShareForm({ ...shareForm, amount: Number(e.target.value) })}
                        className="mt-1.5"
                      />
                    </div>

                    <Button 
                      onClick={() => {
                        if (addShare()) {
                          // Close popover only if share was successfully added
                          document.body.click();
                        }
                      }}
                      type="button"
                    >
                      Add Share
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <div className="mt-4 text-sm text-muted-foreground">
              Total: {shares.reduce((sum, share) => sum + Number(share.amount || 0), 0)} / {form.watch("amount") || 0}
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            className="mt-1.5"
            {...form.register("description")}
          />
        </div>
      </div>

      <div className="pt-4 border-t mt-4">
        <DialogFooter>
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {defaultValues ? "Update Expense" : "Add Expense"}
          </Button>
        </DialogFooter>
      </div>
    </form>
  );
}

function ExpenseCard({ expense, onDelete }: { expense: Expense; onDelete: (id: number) => void }) {
  const formattedDate = format(new Date(expense.date), "PPP");

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formattedDate}
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Expense</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this expense record? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(expense.id)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4" />
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
      try {
        const res = await apiRequest("POST", "/api/business/expenses", data);

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to add expense");
        }

        const responseData = await res.json();
        return responseData;
      } catch (error: any) {
        throw new Error(error.message || "Failed to add expense");
      }
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

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/business/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business/expenses"] });
      toast({ title: "Expense deleted successfully" });
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

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Expense</DialogTitle>
                <DialogDescription>
                  Add a new expense with details including amount, category, and payment information
                </DialogDescription>
              </DialogHeader>
              <ExpenseForm
                onSubmit={(data: any) => addExpenseMutation.mutate(data)}
                onCancel={() => setIsOpen(false)}
              />
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            onClick={() => setImportDialogOpen(true)}
            className="ml-2"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
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
                      onDelete={(id) => deleteExpenseMutation.mutate(id)}
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