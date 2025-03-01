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
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCreditCardSchema, type CreditCard } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, PlusCircle, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function CreditCards() {
  const { toast } = useToast();
  const { data: cards, isLoading } = useQuery<CreditCard[]>({
    queryKey: ["/api/credit-cards"],
  });

  const addCardMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/credit-cards", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credit-cards"] });
      toast({ title: "Credit card added successfully" });
    },
  });

  const updateCardMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/credit-cards/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credit-cards"] });
      toast({ title: "Credit card updated successfully" });
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/credit-cards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credit-cards"] });
      toast({ title: "Credit card deleted successfully" });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-primary">Credit Cards</h1>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Card
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Credit Card</DialogTitle>
              </DialogHeader>
              <CardForm onSubmit={(data) => addCardMutation.mutate(data)} />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : cards?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No credit cards added yet
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards?.map((card) => (
              <CreditCardItem
                key={card.id}
                card={card}
                onUpdate={(data) => updateCardMutation.mutate({ id: card.id, data })}
                onDelete={() => deleteCardMutation.mutate(card.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function CardForm({ onSubmit, defaultValues }: any) {
  const form = useForm({
    resolver: zodResolver(insertCreditCardSchema),
    defaultValues,
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="cardName">Card Name</Label>
        <Input id="cardName" {...form.register("cardName")} />
      </div>
      <div>
        <Label htmlFor="cardNumber">Card Number</Label>
        <Input id="cardNumber" {...form.register("cardNumber")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="expiryDate">Expiry Date</Label>
          <Input id="expiryDate" {...form.register("expiryDate")} placeholder="MM/YY" />
        </div>
        <div>
          <Label htmlFor="cvv">CVV</Label>
          <Input id="cvv" type="password" {...form.register("cvv")} />
        </div>
      </div>
      <div>
        <Label htmlFor="cardType">Card Type</Label>
        <Input id="cardType" {...form.register("cardType")} />
      </div>
      <div>
        <Label htmlFor="bankName">Bank Name</Label>
        <Input id="bankName" {...form.register("bankName")} />
      </div>
      <Button type="submit" className="w-full">
        {defaultValues ? "Update Card" : "Add Card"}
      </Button>
    </form>
  );
}

function CreditCardItem({ card, onUpdate, onDelete }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{card.cardName}</CardTitle>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Credit Card</DialogTitle>
              </DialogHeader>
              <CardForm onSubmit={onUpdate} defaultValues={card} />
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-gray-600">
          <p>Card Number: ••••{card.cardNumber.slice(-4)}</p>
          <p>Expiry: {card.expiryDate}</p>
          <p>Type: {card.cardType}</p>
          <p>Bank: {card.bankName}</p>
        </div>
      </CardContent>
    </Card>
  );
}
