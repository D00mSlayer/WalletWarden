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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExpenseSchema, expenseCategories, paymentSources, paymentMethods, type Expense } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, PlusCircle, Trash2, IndianRupee, Calendar, ChevronRight, ChevronDown, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import React from 'react';

function ExpenseForm({ onSubmit, defaultValues, onCancel }: any) {
  const form = useForm({
    resolver: zodResolver(insertExpenseSchema),
    defaultValues: {
      category: defaultValues?.category || "",
      amount: defaultValues?.amount || "",
      paidBy: defaultValues?.paidBy || "",
      otherPerson: defaultValues?.otherPerson || "",
      paymentMethod: defaultValues?.paymentMethod || "",
      description: defaultValues?.description || "",
      date: defaultValues?.date || format(new Date(), "yyyy-MM-dd"),
      personalShare: defaultValues?.personalShare || 0,
      businessShare: defaultValues?.businessShare || 0,
      otherShare: defaultValues?.otherShare || 0,
    },
    mode: "onChange",
  });

  const amount = form.watch("amount");
  const paidBy = form.watch("paidBy");
  const [isSharedExpense, setIsSharedExpense] = useState(false);

  // Effect to handle shared expense changes
  useEffect(() => {
    if (isSharedExpense) {
      // Clear paid by when switching to shared expense
      form.setValue("paidBy", "", { shouldValidate: true });
      form.setValue("otherPerson", "", { shouldValidate: true });
    }
  }, [isSharedExpense]);

  // Effect to handle amount changes
  useEffect(() => {
    if (amount) {
      const numAmount = Number(amount);
      if (!isSharedExpense) {
        // If not shared, entire amount goes to the payer's category
        if (paidBy === "Business") {
          form.setValue("businessShare", numAmount, { shouldValidate: true });
          form.setValue("personalShare", 0, { shouldValidate: true });
          form.setValue("otherShare", 0, { shouldValidate: true });
        } else if (paidBy === "Personal") {
          form.setValue("personalShare", numAmount, { shouldValidate: true });
          form.setValue("businessShare", 0, { shouldValidate: true });
          form.setValue("otherShare", 0, { shouldValidate: true });
        } else if (paidBy === "Other") {
          form.setValue("otherShare", numAmount, { shouldValidate: true });
          form.setValue("businessShare", 0, { shouldValidate: true });
          form.setValue("personalShare", 0, { shouldValidate: true });
        }
      }
    }
  }, [amount, isSharedExpense, paidBy]);

  const handleSubmit = (data: any) => {
    onSubmit({
      ...data,
      amount: Number(data.amount),
      personalShare: Number(data.personalShare),
      businessShare: Number(data.businessShare),
      otherShare: Number(data.otherShare),
      otherPerson: data.paidBy === "Other" ? data.otherPerson : undefined,
    });
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
        <div className="space-y-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              className="focus:border-l-primary"
              {...form.register("date")}
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={form.watch("category")}
              onValueChange={(value) => form.setValue("category", value, { shouldValidate: true })}
            >
              <SelectTrigger className="focus:border-l-primary">
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
                className="pl-10 focus:border-l-primary"
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
              onChange={(e) => setIsSharedExpense(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="isShared">This is a shared expense</Label>
          </div>

          {!isSharedExpense && (
            <>
              <div>
                <Label htmlFor="paidBy">Paid By</Label>
                <Select
                  value={form.watch("paidBy")}
                  onValueChange={(value) => form.setValue("paidBy", value, { shouldValidate: true })}
                >
                  <SelectTrigger className="focus:border-l-primary">
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

              {paidBy === "Other" && (
                <div>
                  <Label htmlFor="otherPerson">Person Name</Label>
                  <Input
                    id="otherPerson"
                    className="focus:border-l-primary"
                    {...form.register("otherPerson")}
                  />
                  {form.formState.errors.otherPerson && (
                    <p className="text-sm text-red-500">{form.formState.errors.otherPerson.message as string}</p>
                  )}
                </div>
              )}
            </>
          )}

          <div>
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select
              value={form.watch("paymentMethod")}
              onValueChange={(value) => form.setValue("paymentMethod", value, { shouldValidate: true })}
            >
              <SelectTrigger className="focus:border-l-primary">
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

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              className="focus:border-l-primary"
              {...form.register("description")}
            />
          </div>

          {isSharedExpense && (
            <div className="space-y-4 border rounded-lg p-4">
              <h3 className="font-medium">Expense Breakdown</h3>

              <div>
                <Label htmlFor="businessShare">Business Share</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="businessShare"
                    type="number"
                    step="0.01"
                    className="pl-10 focus:border-l-primary"
                    {...form.register("businessShare", { valueAsNumber: true })}
                  />
                </div>
                {form.formState.errors.businessShare && (
                  <p className="text-sm text-red-500">{form.formState.errors.businessShare.message as string}</p>
                )}
              </div>

              <div>
                <Label htmlFor="personalShare">Personal Share</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="personalShare"
                    type="number"
                    step="0.01"
                    className="pl-10 focus:border-l-primary"
                    {...form.register("personalShare", { valueAsNumber: true })}
                  />
                </div>
                {form.formState.errors.personalShare && (
                  <p className="text-sm text-red-500">{form.formState.errors.personalShare.message as string}</p>
                )}
              </div>

              <div>
                <Label htmlFor="otherShare">Other Share</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="otherShare"
                    type="number"
                    step="0.01"
                    className="pl-10 focus:border-l-primary"
                    {...form.register("otherShare", { valueAsNumber: true })}
                  />
                </div>
                {form.formState.errors.otherShare && (
                  <p className="text-sm text-red-500">{form.formState.errors.otherShare.message as string}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {defaultValues ? "Update Expense" : "Add Expense"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ExpenseCard({ expense, onDelete }: any) {
  const formattedDate = format(new Date(expense.date), "PPP");
  const hasShares = expense.personalShare > 0 || expense.businessShare > 0 || expense.otherShare > 0;

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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium mb-1">Paid By</div>
              <div className="text-sm text-muted-foreground">
                {expense.paidBy === "Other" ? expense.otherPerson : expense.paidBy}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Payment Method</div>
              <div className="text-sm text-muted-foreground">{expense.paymentMethod}</div>
            </div>
          </div>

          {hasShares && (
            <div>
              <div className="text-sm font-medium mb-2">Expense Breakdown</div>
              <div className="space-y-1">
                {expense.businessShare > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Business</span>
                    <span className="text-muted-foreground flex items-center">
                      <IndianRupee className="h-3 w-3" />
                      {expense.businessShare}
                    </span>
                  </div>
                )}
                {expense.personalShare > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Personal</span>
                    <span className="text-muted-foreground flex items-center">
                      <IndianRupee className="h-3 w-3" />
                      {expense.personalShare}
                    </span>
                  </div>
                )}
                {expense.otherShare > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Other</span>
                    <span className="text-muted-foreground flex items-center">
                      <IndianRupee className="h-3 w-3" />
                      {expense.otherShare}
                    </span>
                  </div>
                )}
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
  const [filters, setFilters] = useState({
    category: "all",
    paidBy: "all",
    paymentMethod: "all",
  });
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const { data: expenses, isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/business/expenses"],
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/business/expenses", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business/expenses"] });
      toast({ title: "Expense added successfully" });
      setIsOpen(false);
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

  // Filter expenses
  const filteredExpenses = expenses?.filter((expense) => {
    if (filters.category !== "all" && expense.category !== filters.category) return false;
    if (filters.paidBy !== "all") {
      if (filters.paidBy === "Other") {
        // For "Other", include all expenses not paid by Business or Personal
        if (expense.paidBy === "Business" || expense.paidBy === "Personal") return false;
      } else if (expense.paidBy !== filters.paidBy) {
        return false;
      }
    }
    if (filters.paymentMethod !== "all" && expense.paymentMethod !== filters.paymentMethod) return false;
    return true;
  });

  // Group expenses by category
  const groupedExpenses = filteredExpenses?.reduce((groups, expense) => {
    const group = groups[expense.category] || [];
    group.push(expense);
    groups[expense.category] = group;
    return groups;
  }, {} as Record<string, Expense[]>) || {};

  // Calculate category totals
  const categoryTotals = Object.entries(groupedExpenses).reduce((totals, [category, expenses]) => {
    totals[category] = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    return totals;
  }, {} as Record<string, number>);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };


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

          <div className="flex flex-wrap gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 sm:flex-none">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Filter Expenses</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={filters.category}
                      onValueChange={(value) => setFilters(f => ({ ...f, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {expenseCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Paid By</Label>
                    <Select
                      value={filters.paidBy}
                      onValueChange={(value) => setFilters(f => ({ ...f, paidBy: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Sources" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        {paymentSources.map((source) => (
                          <SelectItem key={source} value={source}>
                            {source}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Payment Method</Label>
                    <Select
                      value={filters.paymentMethod}
                      onValueChange={(value) => setFilters(f => ({ ...f, paymentMethod: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Methods" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Methods</SelectItem>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1 sm:flex-none">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent>
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
          <div className="space-y-4">
            {Object.entries(groupedExpenses).map(([category, expenses]) => (
              <Collapsible
                key={category}
                open={expandedCategories.includes(category)}
                onOpenChange={() => toggleCategory(category)}
              >
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="flex flex-row items-center justify-between py-3">
                      <div>
                        <CardTitle className="text-lg font-normal">
                          {category}
                        </CardTitle>
                        <div className="text-sm text-muted-foreground">
                          {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-lg font-medium flex items-center">
                          <IndianRupee className="h-4 w-4" />
                          {categoryTotals[category].toFixed(2)}
                        </div>
                        {expandedCategories.includes(category) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {expenses.map((expense) => (
                          <ExpenseCard
                            key={expense.id}
                            expense={expense}
                            onDelete={(id: number) => deleteExpenseMutation.mutate(id)}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}