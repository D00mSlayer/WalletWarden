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
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { format } from "date-fns";
import { useState } from "react";

function ExpenseForm({ onSubmit, defaultValues, onCancel }: any) {
  const [isSharedExpense, setIsSharedExpense] = useState(false);
  const [shares, setShares] = useState<Share[]>([]);
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
    setShares([...shares, { 
      payerType: "Personal",
      amount: 0,
      paymentMethod: "Cash"
    }]);
  };

  const removeShare = (index: number) => {
    setShares(shares.filter((_, i) => i !== index));
  };

  const updateShare = (index: number, field: keyof Share, value: any) => {
    const newShares = [...shares];
    newShares[index] = { ...newShares[index], [field]: value };
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

        // Format shared expense data
        data.isSharedExpense = true;
        data.shares = shares;
        data.paidBy = undefined;
        data.payerName = undefined;
        data.paymentMethod = undefined;
      } else {
        // Format individual expense data
        data.isSharedExpense = false;
        data.shares = undefined;
      }

      await onSubmit({
        ...data,
        amount: Number(data.amount),
      });
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            className="focus:ring-2 focus:ring-primary"
            {...form.register("date")}
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={form.watch("category")}
            onValueChange={(value) => form.setValue("category", value, { shouldValidate: true })}
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
            <p className="text-sm text-red-500">{form.formState.errors.category.message as string}</p>
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
            <p className="text-sm text-red-500">{form.formState.errors.amount.message as string}</p>
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
          // Individual expense form
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
                <p className="text-sm text-red-500">{form.formState.errors.paidBy.message as string}</p>
              )}
            </div>

            {form.watch("paidBy") === "Other" && (
              <div>
                <Label htmlFor="payerName">Person Name</Label>
                <Input
                  id="payerName"
                  {...form.register("payerName")}
                />
                {form.formState.errors.payerName && (
                  <p className="text-sm text-red-500">{form.formState.errors.payerName.message as string}</p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={form.watch("paymentMethod")}
                onValueChange={(value) => form.setValue("paymentMethod", value, { shouldValidate: true })}
              >
                <SelectTrigger>
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
                <p className="text-sm text-red-500">{form.formState.errors.paymentMethod.message as string}</p>
              )}
            </div>
          </>
        ) : (
          // Shared expense form
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
                    <div className="flex-1 space-y-3">
                      <div>
                        <Label>Payer Type</Label>
                        <Select
                          value={share.payerType}
                          onValueChange={(value: typeof paymentSources[number]) => {
                            updateShare(index, "payerType", value);
                            if (value !== "Other") {
                              updateShare(index, "payerName", undefined);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
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

                      {share.payerType === "Other" && (
                        <div>
                          <Label>Person Name</Label>
                          <Input
                            value={share.payerName || ""}
                            onChange={(e) => updateShare(index, "payerName", e.target.value)}
                            placeholder="Enter person name"
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
                            value={share.amount}
                            onChange={(e) => updateShare(index, "amount", Number(e.target.value))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Payment Method</Label>
                        <Select
                          value={share.paymentMethod}
                          onValueChange={(value: typeof paymentMethods[number]) => 
                            updateShare(index, "paymentMethod", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
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
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={addShare}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Share
              </Button>
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            {...form.register("description")}
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {defaultValues ? "Update Expense" : "Add Expense"}
        </Button>
      </DialogFooter>
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
            // Individual expense display
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
            // Shared expense display
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

export default function Expenses() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

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
        return res.json();
      } catch (error) {
        console.error("Mutation error:", error);
        throw error;
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
        variant: "destructive"
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

  // Group expenses by category
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