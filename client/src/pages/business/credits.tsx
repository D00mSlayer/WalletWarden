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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCustomerCreditSchema, type CustomerCredit } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, PlusCircle, Calendar, IndianRupee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { format } from "date-fns";
import { useState } from "react";

function CreditForm({ onSubmit, defaultValues }: any) {
  const form = useForm({
    resolver: zodResolver(insertCustomerCreditSchema),
    defaultValues: {
      customerName: defaultValues?.customerName || "",
      amount: defaultValues?.amount || "",
      purpose: defaultValues?.purpose || "",
      notes: defaultValues?.notes || "",
    },
    mode: "onChange",
  });

  const handleSubmit = (data: any) => {
    // Ensure amount is converted to number
    const formData = {
      ...data,
      amount: Number(data.amount),
    };
    onSubmit(formData);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="customerName">Customer Name</Label>
        <Input
          id="customerName"
          {...form.register("customerName")}
        />
        {form.formState.errors.customerName && (
          <p className="text-sm text-red-500">{form.formState.errors.customerName.message as string}</p>
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
        <Label htmlFor="purpose">Purpose</Label>
        <Input
          id="purpose"
          {...form.register("purpose")}
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          {...form.register("notes")}
        />
      </div>

      <Button type="submit" className="w-full">
        {defaultValues ? "Update Credit" : "Add Credit"}
      </Button>
    </form>
  );
}

function CreditCard({ credit, onMarkPaid, onDelete }: any) {
  const isPending = credit.status === "pending";
  const formattedDate = format(new Date(credit.date), "PPP");
  const formattedPaidDate = credit.paidDate ? format(new Date(credit.paidDate), "PPP") : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-normal">{credit.customerName}</CardTitle>
          <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formattedDate}
          </div>
        </div>
        <Badge variant={isPending ? "destructive" : "default"}>
          {isPending ? "Pending" : "Paid"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-1">Amount</div>
            <div className="text-2xl font-medium flex items-center">
              <IndianRupee className="h-4 w-4" />
              {credit.amount}
            </div>
          </div>

          {credit.purpose && (
            <div>
              <div className="text-sm font-medium mb-1">Purpose</div>
              <div className="text-sm">{credit.purpose}</div>
            </div>
          )}

          {credit.notes && (
            <div>
              <div className="text-sm font-medium mb-1">Notes</div>
              <div className="text-sm text-muted-foreground">{credit.notes}</div>
            </div>
          )}

          {formattedPaidDate && (
            <div>
              <div className="text-sm font-medium mb-1">Paid On</div>
              <div className="text-sm text-muted-foreground">{formattedPaidDate}</div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {isPending && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="default" className="flex-1">Mark as Paid</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Mark as Paid</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to mark this credit as paid? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onMarkPaid(credit.id)}>
                      Mark as Paid
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex-1">Delete</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Credit</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this credit record? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(credit.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CustomerCredits() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const { data: credits, isLoading } = useQuery<CustomerCredit[]>({
    queryKey: ["/api/business/credits"],
  });

  const addCreditMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/business/credits", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business/credits"] });
      toast({ title: "Credit added successfully" });
      setIsOpen(false);
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/business/credits/${id}/paid`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business/credits"] });
      toast({ title: "Credit marked as paid" });
    },
  });

  const deleteCreditMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/business/credits/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business/credits"] });
      toast({ title: "Credit deleted successfully" });
    },
  });

  const pendingCredits = credits?.filter((credit) => credit.status === "pending") || [];
  const paidCredits = credits?.filter((credit) => credit.status === "paid") || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/business" className="text-gray-600 hover:text-gray-900">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-primary">Customer Credits</h1>

          <div className="flex-1" />

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Credit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Credit</DialogTitle>
              </DialogHeader>
              <CreditForm onSubmit={(data: any) => addCreditMutation.mutate(data)} />
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
              <h2 className="text-xl font-semibold mb-4">Pending Credits</h2>
              {pendingCredits.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-gray-500">
                    No pending credits
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pendingCredits.map((credit) => (
                    <CreditCard
                      key={credit.id}
                      credit={credit}
                      onMarkPaid={(id: number) => markPaidMutation.mutate(id)}
                      onDelete={(id: number) => deleteCreditMutation.mutate(id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {paidCredits.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Payment History</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {paidCredits.map((credit) => (
                    <CreditCard
                      key={credit.id}
                      credit={credit}
                      onDelete={(id: number) => deleteCreditMutation.mutate(id)}
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
