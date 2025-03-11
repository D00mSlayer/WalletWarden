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
import { useState, useEffect } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

function ExpenseForm({ onSubmit, onCancel }: any) {
  const [isSharedExpense, setIsSharedExpense] = useState(false);
  const [shares, setShares] = useState<Share[]>([]);
  const [shareForm, setShareForm] = useState<Partial<Share>>({});
  const [sharePopoverOpen, setSharePopoverOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertExpenseSchema),
    defaultValues: {
      category: "",
      amount: "",
      date: new Date().toISOString().split('T')[0],
      description: "",
      isSharedExpense: false,
      paidBy: "",
      payerName: "",
      paymentMethod: "",
      shares: [],
    },
    mode: "onChange"
  });

  // Reset form fields when switching between shared and individual expense
  useEffect(() => {
    if (isSharedExpense) {
      form.setValue("paidBy", "");
      form.setValue("payerName", "");
      form.setValue("paymentMethod", "");
    } else {
      setShares([]);
    }
  }, [isSharedExpense, form]);

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
    setShareForm({});
    setSharePopoverOpen(false);
    return true;
  };

  const removeShare = (index: number) => {
    setShares(prevShares => prevShares.filter((_, i) => i !== index));
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

        const totalShares = shares.reduce((sum, share) => sum + Number(share.amount), 0);
        const formAmount = Number(data.amount);

        if (Math.abs(totalShares - formAmount) > 0.01) {
          toast({
            title: "Error",
            description: "Total shares must equal the expense amount",
            variant: "destructive",
          });
          return;
        }

        const formattedData = {
          category: data.category,
          amount: formAmount,
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
      toast({
        title: "Error",
        description: "Failed to submit expense",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="space-y-4">
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
          {form.formState.errors.category && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.category.message as string}
            </p>
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
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.amount.message as string}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isShared"
            checked={isSharedExpense}
            onChange={(e) => setIsSharedExpense(e.target.checked)}
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
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Expense Shares</h3>
              <div className="text-sm">
                Remaining: ₹{Math.max(0, Number(form.watch("amount") || 0) - shares.reduce((sum, share) => sum + Number(share.amount), 0)).toFixed(2)}
              </div>
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
                    onClick={() => removeShare(index)}
                    className="text-destructive"
                  >
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Popover 
              open={sharePopoverOpen} 
              onOpenChange={setSharePopoverOpen}
            >
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
              <PopoverContent 
                className="w-80" 
                align="start"
                sideOffset={5}
              >
                <div className="space-y-4 p-4">
                  <div>
                    <Label>Payer</Label>
                    <Select
                      value={shareForm.payerType}
                      onValueChange={(value) => setShareForm(prev => ({
                        ...prev,
                        payerType: value,
                        payerName: value === "Other" ? prev.payerName : undefined
                      }))}
                    >
                      <SelectTrigger className="mt-1.5">
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
                      <Label>Person Name</Label>
                      <Input
                        value={shareForm.payerName || ""}
                        onChange={(e) => setShareForm(prev => ({ ...prev, payerName: e.target.value }))}
                        className="mt-1.5"
                        placeholder="Enter name"
                      />
                    </div>
                  )}

                  <div>
                    <Label>Amount</Label>
                    <div className="relative mt-1.5">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        type="number"
                        step="0.01"
                        className="pl-10"
                        value={shareForm.amount || ""}
                        onChange={(e) => setShareForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                        placeholder="Enter amount"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Payment Method</Label>
                    <Select
                      value={shareForm.paymentMethod}
                      onValueChange={(value) => setShareForm(prev => ({ ...prev, paymentMethod: value }))}
                    >
                      <SelectTrigger className="mt-1.5">
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
                    onClick={addShare}
                  >
                    Add Share
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <div className="text-sm text-muted-foreground">
              Total Shares: ₹{shares.reduce((sum, share) => sum + Number(share.amount), 0)} / ₹{form.watch("amount") || 0}
            </div>
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
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Add Expense
        </Button>
      </DialogFooter>
    </form>
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
              </DialogHeader>
              <ExpenseForm
                onSubmit={(data: any) => addExpenseMutation.mutate(data)}
                onCancel={() => setIsOpen(false)}
              />
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