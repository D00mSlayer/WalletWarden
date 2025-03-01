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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCreditCardSchema, cardNetworks, type CreditCard } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, PlusCircle, Pencil, Trash2 } from "lucide-react";
import { SiVisa, SiMastercard, SiAmericanexpress } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useState, useEffect } from "react";

function formatExpiryDate(value: string) {
  // Remove any non-digit characters
  const cleaned = value.replace(/\D/g, "");

  // Add slash after month if we have at least 2 digits
  if (cleaned.length >= 2) {
    return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
  }

  return cleaned;
}

export default function CreditCards() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
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
      setIsOpen(false); // Close modal on success
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
      setIsOpen(false); // Close modal on success
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

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
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

  const cardNetwork = form.watch("cardNetwork");
  const [prevNetwork, setPrevNetwork] = useState(cardNetwork);

  useEffect(() => {
    if (prevNetwork === cardNetwork) return;

    // If switching to or from Amex, clear sensitive fields
    if (cardNetwork === "American Express" || prevNetwork === "American Express") {
      form.setValue("cardNumber", "");
      form.setValue("cvv", "");
      form.setValue("expiryDate", "");
    }

    setPrevNetwork(cardNetwork);
  }, [cardNetwork, prevNetwork, form]);

  // Handle expiry date formatting
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    form.setValue("expiryDate", formatted);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="cardName">Card Name</Label>
        <Input id="cardName" {...form.register("cardName")} />
        {form.formState.errors.cardName && (
          <p className="text-sm text-red-500">{form.formState.errors.cardName.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="cardNetwork">Card Network</Label>
        <Select
          value={form.watch("cardNetwork")}
          onValueChange={(value) => form.setValue("cardNetwork", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select card network" />
          </SelectTrigger>
          <SelectContent>
            {cardNetworks.map((network) => (
              <SelectItem key={network} value={network}>
                {network}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.cardNetwork && (
          <p className="text-sm text-red-500">{form.formState.errors.cardNetwork.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="cardNumber">Card Number</Label>
        <Input
          id="cardNumber"
          {...form.register("cardNumber")}
          maxLength={cardNetwork === "American Express" ? 15 : 16}
        />
        {form.formState.errors.cardNumber && (
          <p className="text-sm text-red-500">{form.formState.errors.cardNumber.message as string}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="expiryDate">Expiry Date</Label>
          <Input
            id="expiryDate"
            {...form.register("expiryDate")}
            placeholder="MM/YY"
            onChange={handleExpiryChange}
            maxLength={5}
          />
          {form.formState.errors.expiryDate && (
            <p className="text-sm text-red-500">{form.formState.errors.expiryDate.message as string}</p>
          )}
        </div>
        <div>
          <Label htmlFor="cvv">CVV</Label>
          <Input
            id="cvv"
            type="password"
            {...form.register("cvv")}
            maxLength={cardNetwork === "American Express" ? 4 : 3}
          />
          {form.formState.errors.cvv && (
            <p className="text-sm text-red-500">{form.formState.errors.cvv.message as string}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="bankName">Bank Name</Label>
        <Input id="bankName" {...form.register("bankName")} />
        {form.formState.errors.bankName && (
          <p className="text-sm text-red-500">{form.formState.errors.bankName.message as string}</p>
        )}
      </div>

      <Button type="submit" className="w-full">
        {defaultValues ? "Update Card" : "Add Card"}
      </Button>
    </form>
  );
}

function getCardIcon(network: string) {
  switch (network) {
    case "Visa":
      return <SiVisa className="h-8 w-8" />;
    case "Mastercard":
      return <SiMastercard className="h-8 w-8" />;
    case "American Express":
      return <SiAmericanexpress className="h-8 w-8" />;
    default:
      return null;
  }
}

function CreditCardItem({ card, onUpdate, onDelete }: any) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 text-white">
      <CardHeader className="flex flex-row items-start justify-between pb-8">
        <div>
          <CardTitle className="text-lg font-normal mb-1">{card.cardName}</CardTitle>
          <div className="text-xs opacity-75">{card.bankName}</div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:text-white/80">
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
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:text-white/80"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-xl tracking-widest">
              ••••{card.cardNumber.slice(-4)}
            </div>
            {getCardIcon(card.cardNetwork)}
          </div>
          <div className="flex justify-between items-end text-sm">
            <div>
              <div className="opacity-75 text-xs mb-1">Expires</div>
              {card.expiryDate}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}