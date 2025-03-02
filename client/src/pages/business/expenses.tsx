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
import { insertExpenseSchema, expenseCategories, paymentSources, paymentMethods, type Expense } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, PlusCircle, Trash2, IndianRupee, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { format } from "date-fns";
import { useState } from "react";

function ExpenseForm({ onSubmit, defaultValues }: any) {
  const form = useForm({
    resolver: zodResolver(insertExpenseSchema),
    defaultValues: {
      category: defaultValues?.category || "",
      amount: defaultValues?.amount || "",
      paidBy: defaultValues?.paidBy || "",
      paymentMethod: defaultValues?.paymentMethod || "",
      description: defaultValues?.description || "",
      date: defaultValues?.date || format(new Date(), "yyyy-MM-dd"),
    },
    mode: "onChange",
  });

  const handleSubmit = (data: any) => {
    onSubmit({
      ...data,
      amount: Number(data.amount),
    });
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
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

      <div>
        <Label htmlFor="paidBy">Paid By</Label>
        <Select
          value={form.watch("paidBy")}
          onValueChange={(value) => form.setValue("paidBy", value, { shouldValidate: true })}
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

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          {...form.register("description")}
        />
      </div>

      <Button type="submit" className="w-full">
        {defaultValues ? "Update Expense" : "Add Expense"}
      </Button>
    </form>
  );
}

function ExpenseCard({ expense, onDelete }: any) {
  const formattedDate = format(new Date(expense.date), "PPP");

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-normal">{expense.category}</CardTitle>
          <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
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
            <div className="text-sm font-medium mb-1">Amount</div>
            <div className="text-2xl font-medium flex items-center">
              <IndianRupee className="h-4 w-4" />
              {expense.amount}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium mb-1">Paid By</div>
              <div className="text-sm text-muted-foreground">{expense.paidBy}</div>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Payment Method</div>
              <div className="text-sm text-muted-foreground">{expense.paymentMethod}</div>
            </div>
          </div>

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

  // Group expenses by date
  const groupedExpenses = expenses?.reduce((groups, expense) => {
    const date = format(new Date(expense.date), "PPP");
    const group = groups[date] || [];
    group.push(expense);
    groups[date] = group;
    return groups;
  }, {} as Record<string, Expense[]>) || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/business" className="text-gray-600 hover:text-gray-900">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-primary">Business Expenses</h1>

          <div className="flex-1" />

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Expense</DialogTitle>
              </DialogHeader>
              <ExpenseForm onSubmit={(data: any) => addExpenseMutation.mutate(data)} />
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
            {Object.entries(groupedExpenses).map(([date, dayExpenses]) => (
              <div key={date}>
                <h2 className="text-xl font-semibold mb-4">{date}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {dayExpenses.map((expense) => (
                    <ExpenseCard
                      key={expense.id}
                      expense={expense}
                      onDelete={(id: number) => deleteExpenseMutation.mutate(id)}
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