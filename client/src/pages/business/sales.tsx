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
import { insertDailySalesSchema, type DailySales } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, PlusCircle, Trash2, IndianRupee, Calendar, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { format } from "date-fns";
import { useState } from "react";

function SalesForm({ onSubmit, defaultValues, onCancel }: any) {
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(insertDailySalesSchema),
    defaultValues: {
      date: defaultValues?.date || format(new Date(), "yyyy-MM-dd"),
      cashAmount: defaultValues?.cashAmount || "",
      cardAmount: defaultValues?.cardAmount || "",
      upiAmount: defaultValues?.upiAmount || "",
      notes: defaultValues?.notes || "",
    },
  });

  const calculateTotal = () => {
    const cashAmount = Number(form.watch("cashAmount") || 0);
    const cardAmount = Number(form.watch("cardAmount") || 0);
    const upiAmount = Number(form.watch("upiAmount") || 0);
    return cashAmount + cardAmount + upiAmount;
  };

  const handleSubmit = async (data: any) => {
    try {
      const formattedData = {
        ...data,
        cashAmount: Number(data.cashAmount || 0),
        cardAmount: Number(data.cardAmount || 0),
        upiAmount: Number(data.upiAmount || 0),
      };

      await onSubmit(formattedData);
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: "Failed to submit sales data",
        variant: "destructive",
      });
    }
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
          <Label htmlFor="cashAmount">Cash Amount</Label>
          <div className="relative mt-1.5">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              id="cashAmount"
              type="number"
              step="0.01"
              placeholder="Enter cash amount"
              className="pl-10"
              {...form.register("cashAmount")}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="cardAmount">Card Amount</Label>
          <div className="relative mt-1.5">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              id="cardAmount"
              type="number"
              step="0.01"
              placeholder="Enter card amount"
              className="pl-10"
              {...form.register("cardAmount")}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="upiAmount">UPI Amount</Label>
          <div className="relative mt-1.5">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              id="upiAmount"
              type="number"
              step="0.01"
              placeholder="Enter UPI amount"
              className="pl-10"
              {...form.register("upiAmount")}
            />
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span>Total Amount:</span>
            <span className="font-medium">₹{calculateTotal().toFixed(2)}</span>
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Input
            id="notes"
            className="mt-1.5"
            placeholder="Add any notes (optional)"
            {...form.register("notes")}
          />
        </div>
      </div>

      <div className="pt-4 border-t mt-4">
        <DialogFooter>
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {defaultValues ? "Update Sales" : "Add Sales"}
          </Button>
        </DialogFooter>
      </div>
    </form>
  );
}

function SalesCard({ sales, onEdit, onDelete }: { sales: DailySales; onEdit: () => void; onDelete: (id: number) => void }) {
  const formattedDate = format(new Date(sales.date), "PPP");

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="text-sm text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {formattedDate}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Sales Record</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this sales record? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(sales.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-2xl font-medium flex items-center">
              <IndianRupee className="h-4 w-4" />
              {Number(sales.totalAmount).toFixed(2)}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium mb-1">Cash</div>
              <div className="text-sm text-muted-foreground flex items-center">
                <IndianRupee className="h-3 w-3" />
                {Number(sales.cashAmount).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Card</div>
              <div className="text-sm text-muted-foreground flex items-center">
                <IndianRupee className="h-3 w-3" />
                {Number(sales.cardAmount).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">UPI</div>
              <div className="text-sm text-muted-foreground flex items-center">
                <IndianRupee className="h-3 w-3" />
                {Number(sales.upiAmount).toFixed(2)}
              </div>
            </div>
          </div>

          {sales.notes && (
            <div>
              <div className="text-sm font-medium mb-1">Notes</div>
              <div className="text-sm text-muted-foreground">{sales.notes}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Sales() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSales, setSelectedSales] = useState<DailySales | null>(null);

  const { data: sales, isLoading } = useQuery<DailySales[]>({
    queryKey: ["/api/business/sales"],
  });

  const addSalesMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const res = await apiRequest("POST", "/api/business/sales", data);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to add sales record");
        }
        return await res.json();
      } catch (error: any) {
        throw new Error(error.message || "Failed to add sales record");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business/sales"] });
      toast({ title: "Sales record added successfully" });
      setIsOpen(false);
      setSelectedSales(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add sales record",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSalesMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/business/sales/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business/sales"] });
      toast({ title: "Sales record updated successfully" });
      setIsOpen(false);
      setSelectedSales(null);
    },
  });

  const deleteSalesMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/business/sales/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business/sales"] });
      toast({ title: "Sales record deleted successfully" });
    },
  });

  const handleEdit = (sales: DailySales) => {
    setSelectedSales(sales);
    setIsOpen(true);
  };

  const handleSubmit = async (data: any) => {
    if (selectedSales) {
      await updateSalesMutation.mutate({ id: selectedSales.id, data });
    } else {
      await addSalesMutation.mutate(data);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/business" className="text-gray-600 hover:text-gray-900">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-primary">Daily Sales</h1>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Sales Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{selectedSales ? "Edit Sales Record" : "Add Sales Record"}</DialogTitle>
                <DialogDescription>
                  Record your daily sales with a breakdown of payment methods
                </DialogDescription>
              </DialogHeader>
              <SalesForm
                onSubmit={handleSubmit}
                onCancel={() => {
                  setIsOpen(false);
                  setSelectedSales(null);
                }}
                defaultValues={selectedSales}
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
        ) : !sales?.length ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No sales records yet
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sales.map((record) => (
              <SalesCard
                key={record.id}
                sales={record}
                onEdit={() => handleEdit(record)}
                onDelete={(id) => deleteSalesMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}