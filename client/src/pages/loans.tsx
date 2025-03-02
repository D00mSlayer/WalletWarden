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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLoanSchema, insertRepaymentSchema, type Loan, type Repayment } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, PlusCircle, IndianRupee, CheckCircle2, History, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";

function LoanForm({ onSubmit, defaultValues }: any) {
  const form = useForm({
    resolver: zodResolver(insertLoanSchema),
    defaultValues: {
      personName: defaultValues?.personName || "",
      amount: defaultValues?.amount || "",
      type: defaultValues?.type || "",
      description: defaultValues?.description || "",
      tags: Array.isArray(defaultValues?.tags) ? defaultValues.tags : [],
    },
    mode: "onChange",
  });

  const [newTag, setNewTag] = useState("");
  const tags = form.watch("tags") || [];

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newTag.trim()) {
      e.preventDefault();
      const trimmedTag = newTag.trim();
      if (!tags.includes(trimmedTag)) {
        form.setValue("tags", [...tags, trimmedTag], { shouldValidate: true });
        setNewTag("");
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    form.setValue(
      "tags",
      tags.filter((tag: string) => tag !== tagToRemove),
      { shouldValidate: true }
    );
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="personName">Person Name</Label>
        <Input
          id="personName"
          {...form.register("personName")}
          defaultValue={defaultValues?.personName}
        />
        {form.formState.errors.personName && (
          <p className="text-sm text-red-500">{form.formState.errors.personName.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="amount">Amount</Label>
        <div className="relative">
          <IndianRupee className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
          <Input
            id="amount"
            type="number"
            step="0.01"
            className="pl-10"
            {...form.register("amount", { valueAsNumber: true })}
            defaultValue={defaultValues?.amount}
          />
        </div>
        {form.formState.errors.amount && (
          <p className="text-sm text-red-500">{form.formState.errors.amount.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="type">Type</Label>
        <Select
          value={form.watch("type")}
          onValueChange={(value) => form.setValue("type", value, { shouldValidate: true })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="given">Given</SelectItem>
            <SelectItem value="received">Received</SelectItem>
          </SelectContent>
        </Select>
        {form.formState.errors.type && (
          <p className="text-sm text-red-500">{form.formState.errors.type.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          {...form.register("description")}
          defaultValue={defaultValues?.description}
        />
      </div>

      <div>
        <Label htmlFor="tags">Tags</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {Array.isArray(tags) && tags.map((tag: string) => (
            <Badge key={tag} variant="secondary" className="text-sm">
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 hover:text-destructive focus:outline-none"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <Input
          id="tags"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={handleAddTag}
          placeholder="Type a tag and press Enter"
        />
      </div>

      <Button type="submit" className="w-full">
        {defaultValues ? "Update Loan" : "Add Loan"}
      </Button>
    </form>
  );
}

function RepaymentForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const form = useForm({
    resolver: zodResolver(insertRepaymentSchema),
    defaultValues: {
      amount: "",
      note: "",
    },
    mode: "onChange",
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="amount">Amount</Label>
        <div className="relative">
          <IndianRupee className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
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
        <Label htmlFor="note">Note (Optional)</Label>
        <Input
          id="note"
          {...form.register("note")}
        />
      </div>

      <Button type="submit" className="w-full">Add Repayment</Button>
    </form>
  );
}

function LoanCard({ loan, onUpdate, onComplete, onDelete }: any) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRepaymentOpen, setIsRepaymentOpen] = useState(false);
  const { toast } = useToast();

  const { data: repayments = [], isLoading: isLoadingRepayments } = useQuery<Repayment[]>({
    queryKey: [`/api/loans/${loan.id}/repayments`],
  });

  const createRepaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/loans/${loan.id}/repayments`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/loans/${loan.id}/repayments`] });
      toast({ title: "Repayment added successfully" });
      setIsRepaymentOpen(false);
    },
  });

  const totalRepaid = repayments.reduce((sum, repayment) => sum + Number(repayment.amount), 0);
  const remainingAmount = Number(loan.amount) - totalRepaid;

  const handleUpdate = async (data: any) => {
    await onUpdate(data);
    setIsEditOpen(false);
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between pb-4">
        <div>
          <CardTitle className="text-lg font-normal mb-1">
            {loan.personName}
            <Badge
              variant={loan.type === "given" ? "destructive" : "default"}
              className="ml-2"
            >
              {loan.type === "given" ? "Given" : "Received"}
            </Badge>
            {loan.status === "completed" && (
              <Badge variant="secondary" className="ml-2">Completed</Badge>
            )}
          </CardTitle>
          <div className="text-2xl font-semibold">₹{loan.amount}</div>
          {loan.description && (
            <div className="text-sm text-muted-foreground mt-1">{loan.description}</div>
          )}
        </div>
        {loan.status === "active" && (
          <div className="flex gap-2">
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Loan</DialogTitle>
                </DialogHeader>
                <LoanForm onSubmit={handleUpdate} defaultValues={loan} />
              </DialogContent>
            </Dialog>

            <Dialog open={isRepaymentOpen} onOpenChange={setIsRepaymentOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <IndianRupee className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Repayment</DialogTitle>
                </DialogHeader>
                <RepaymentForm onSubmit={(data) => createRepaymentMutation.mutate(data)} />
              </DialogContent>
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Complete Loan</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to mark this loan as completed?
                    {remainingAmount > 0 && (
                      <div className="mt-2 text-destructive">
                        Warning: There is still ₹{remainingAmount} remaining to be paid.
                      </div>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onComplete}>Complete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Loan</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this loan? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <div>Created: {new Date(loan.createdAt).toLocaleDateString()}</div>
            {loan.completedAt && (
              <div>Completed: {new Date(loan.completedAt).toLocaleDateString()}</div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <History className="h-4 w-4" />
              <span className="font-medium">Repayment History</span>
            </div>
            {isLoadingRepayments ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : repayments.length === 0 ? (
              <div className="text-sm text-muted-foreground">No repayments yet</div>
            ) : (
              <div className="space-y-2">
                {repayments.map((repayment) => (
                  <div key={repayment.id} className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div>₹{repayment.amount}</div>
                      {repayment.note && (
                        <div className="text-muted-foreground">({repayment.note})</div>
                      )}
                    </div>
                    <div>{new Date(repayment.date).toLocaleDateString()}</div>
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm font-medium">
                    <div>Total Repaid</div>
                    <div>₹{totalRepaid}</div>
                  </div>
                  {loan.status === "active" && (
                    <div className="flex justify-between text-sm font-medium mt-1">
                      <div>Remaining</div>
                      <div>₹{remainingAmount}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Loans() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const { data: loans, isLoading } = useQuery<Loan[]>({
    queryKey: ["/api/loans"],
  });

  const addLoanMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/loans", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      toast({ title: "Loan added successfully" });
      setIsOpen(false);
    },
  });

  const updateLoanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/loans/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      toast({ title: "Loan updated successfully" });
    },
  });

  const completeLoanMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/loans/${id}/complete`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      toast({ title: "Loan marked as completed" });
    },
  });

  const deleteLoanMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/loans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      toast({ title: "Loan deleted successfully" });
    },
  });

  const activeLoans = loans?.filter((loan) => loan.status === "active") || [];
  const completedLoans = loans?.filter((loan) => loan.status === "completed") || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-primary">Loans</h1>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Loan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Loan</DialogTitle>
              </DialogHeader>
              <LoanForm onSubmit={(data) => addLoanMutation.mutate(data)} />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Active Loans</h2>
              {activeLoans.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-gray-500">
                    No active loans
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeLoans.map((loan) => (
                    <LoanCard
                      key={loan.id}
                      loan={loan}
                      onUpdate={(data) => updateLoanMutation.mutate({ id: loan.id, data })}
                      onComplete={() => completeLoanMutation.mutate(loan.id)}
                      onDelete={() => deleteLoanMutation.mutate(loan.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {completedLoans.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Completed Loans</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {completedLoans.map((loan) => (
                    <LoanCard
                      key={loan.id}
                      loan={loan}
                      onDelete={() => deleteLoanMutation.mutate(loan.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
