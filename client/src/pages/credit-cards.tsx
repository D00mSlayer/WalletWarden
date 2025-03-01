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
import { insertCreditCardSchema, cardNetworks, bankIssuers, type CreditCard } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, PlusCircle, Pencil, Trash2 } from "lucide-react";
import { SiVisa, SiMastercard, SiAmericanexpress } from "react-icons/si";
import { RiVisaLine } from "react-icons/ri"; // For Rupay icon since there's no direct Rupay icon
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";
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

function formatExpiryDate(value: string) {
  const cleaned = value.replace(/\D/g, "");

  if (cleaned.length >= 2) {
    const month = parseInt(cleaned.slice(0, 2));
    if (month > 12) {
      return "12/" + cleaned.slice(2, 4);
    }
    if (month < 1) {
      return "01/" + cleaned.slice(2, 4);
    }
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
      setIsOpen(false);
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
      setIsOpen(false);
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
    defaultValues: {
      cardName: defaultValues?.cardName || "",
      cardNumber: defaultValues?.cardNumber || "",
      expiryDate: defaultValues?.expiryDate || "",
      cvv: defaultValues?.cvv || "",
      cardNetwork: defaultValues?.cardNetwork || "",
      issuer: defaultValues?.issuer || "",
    },
    mode: "onChange",
  });

  const cardNetwork = form.watch("cardNetwork");
  const [prevNetwork, setPrevNetwork] = useState(cardNetwork);

  const expiryRef = useRef<HTMLInputElement>(null);
  const cvvRef = useRef<HTMLInputElement>(null);
  const issuerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (prevNetwork === cardNetwork) return;

    if (cardNetwork === "American Express" || prevNetwork === "American Express") {
      form.setValue("cardNumber", "");
      form.setValue("cvv", "");
      form.setValue("expiryDate", "");
    }

    setPrevNetwork(cardNetwork);
  }, [cardNetwork, prevNetwork, form]);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue("cardNumber", value, { shouldValidate: true });
    const maxLength = cardNetwork === "American Express" ? 15 : 16;
    if (value.length === maxLength) {
      expiryRef.current?.focus();
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleaned = value.replace(/\D/g, "");

    if (cleaned.length >= 2) {
      const month = parseInt(cleaned.slice(0, 2));
      if (month > 12) {
        form.setValue("expiryDate", "12/" + cleaned.slice(2, 4), { shouldValidate: true });
      } else if (month < 1) {
        form.setValue("expiryDate", "01/" + cleaned.slice(2, 4), { shouldValidate: true });
      } else {
        form.setValue("expiryDate", cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4), { shouldValidate: true });
      }

      if (cleaned.length >= 4) {
        cvvRef.current?.focus();
      }
    } else {
      form.setValue("expiryDate", cleaned, { shouldValidate: true });
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue("cvv", value, { shouldValidate: true });
    const maxLength = cardNetwork === "American Express" ? 4 : 3;
    if (value.length === maxLength) {
      issuerRef.current?.focus();
    }
  };

  const capitalizeFirstWord = (str: string) => {
    return str.replace(/^\w/, c => c.toUpperCase());
  };

  const handleIssuerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = capitalizeFirstWord(e.target.value);
    form.setValue("issuer", value, { shouldValidate: true });
  };

  const handleCardNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = capitalizeFirstWord(e.target.value);
    form.setValue("cardName", value, { shouldValidate: true });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="cardName">Card Name</Label>
        <Input
          id="cardName"
          {...form.register("cardName")}
          onChange={handleCardNameChange}
        />
        {form.formState.errors.cardName && (
          <p className="text-sm text-red-500">{form.formState.errors.cardName.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="cardNetwork">Card Network</Label>
        <Select
          value={form.watch("cardNetwork")}
          onValueChange={(value) => form.setValue("cardNetwork", value, { shouldValidate: true })}
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
          inputMode="numeric"
          pattern="[0-9]*"
          {...form.register("cardNumber")}
          onChange={handleCardNumberChange}
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
            inputMode="numeric"
            pattern="[0-9]*"
            {...form.register("expiryDate")}
            placeholder="MM/YY"
            onChange={handleExpiryChange}
            maxLength={5}
            ref={expiryRef}
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
            inputMode="numeric"
            pattern="[0-9]*"
            {...form.register("cvv")}
            onChange={handleCvvChange}
            maxLength={cardNetwork === "American Express" ? 4 : 3}
            ref={cvvRef}
          />
          {form.formState.errors.cvv && (
            <p className="text-sm text-red-500">{form.formState.errors.cvv.message as string}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="issuer">Issuer</Label>
        <Select
          value={form.watch("issuer")}
          onValueChange={(value) => form.setValue("issuer", value, { shouldValidate: true })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select bank" />
          </SelectTrigger>
          <SelectContent>
            {bankIssuers.map((bank) => (
              <SelectItem key={bank} value={bank}>
                {bank}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.issuer && (
          <p className="text-sm text-red-500">{form.formState.errors.issuer.message as string}</p>
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
    case "Rupay":
      return <RiVisaLine className="h-8 w-8" />;
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
          <div className="text-xs opacity-75">{card.issuer}</div>
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

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:text-white/80"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Credit Card</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this credit card? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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