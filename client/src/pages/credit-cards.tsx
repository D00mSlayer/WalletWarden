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
import { Loader2, PlusCircle, Pencil, Trash2, X } from "lucide-react";
import { SiVisa, SiMastercard, SiAmericanexpress } from "react-icons/si";
import { BsCreditCard2Front } from "react-icons/bs"; // Better icon for Rupay
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
import { Badge } from "@/components/ui/badge";

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

function formatCardNumber(number: string, network: string, showFull: boolean = false): string {
  if (!showFull) {
    if (network === "American Express") {
      return `•••• •••••• ${number.slice(-5)}`;
    }
    return `•••• •••• •••• ${number.slice(-4)}`;
  }

  // Format full number
  if (network === "American Express") {
    return `${number.slice(0, 4)} ${number.slice(4, 10)} ${number.slice(10)}`;
  }
  return `${number.slice(0, 4)} ${number.slice(4, 8)} ${number.slice(8, 12)} ${number.slice(12)}`;
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
      tags: Array.isArray(defaultValues?.tags) ? defaultValues.tags : [],
    },
    mode: "onChange",
  });

  const cardNetwork = form.watch("cardNetwork");
  const [prevNetwork, setPrevNetwork] = useState(cardNetwork);
  const [newTag, setNewTag] = useState("");
  const tags = form.watch("tags") || [];

  const expiryRef = useRef<HTMLInputElement>(null);
  const cvvRef = useRef<HTMLInputElement>(null);
  const issuerRef = useRef<HTMLButtonElement>(null);

  // Initialize form with default values
  useEffect(() => {
    if (defaultValues) {
      Object.entries(defaultValues).forEach(([key, value]) => {
        form.setValue(key as any, value, { shouldValidate: true });
      });
    }
  }, [defaultValues, form]);

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

  const handleCardNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = capitalizeFirstWord(e.target.value);
    form.setValue("cardName", value, { shouldValidate: true });
  };

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
        <Label htmlFor="cardName">Card Name</Label>
        <Input
          id="cardName"
          {...form.register("cardName")}
          onChange={handleCardNameChange}
          defaultValue={defaultValues?.cardName}
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
          defaultValue={defaultValues?.cardNumber}
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
            defaultValue={defaultValues?.expiryDate}
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
            defaultValue={defaultValues?.cvv}
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
          <SelectTrigger ref={issuerRef}>
            <SelectValue placeholder="Select bank" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
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
      return <BsCreditCard2Front className="h-8 w-8" />;
    default:
      return null;
  }
}

function getCardGradient(network: string) {
  switch (network) {
    case "Visa":
      return "from-blue-800 to-blue-900";
    case "Mastercard":
      return "from-orange-600 to-red-800";
    case "American Express":
      return "from-emerald-700 to-emerald-900";
    case "Rupay":
      return "from-indigo-700 to-purple-900";
    default:
      return "from-gray-800 to-gray-900";
  }
}

function CreditCardItem({ card, onUpdate, onDelete }: any) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showFullNumber, setShowFullNumber] = useState(false);
  const { toast } = useToast();
  const gradient = getCardGradient(card.cardNetwork);

  // Auto-hide number after 5 seconds
  useEffect(() => {
    if (showFullNumber) {
      const timer = setTimeout(() => {
        setShowFullNumber(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showFullNumber]);

  const handleUpdate = async (data: any) => {
    await onUpdate(data);
    setIsEditOpen(false);
  };

  const copyCardNumber = async () => {
    if (!showFullNumber) return; // Only allow copy when number is visible

    try {
      await navigator.clipboard.writeText(card.cardNumber);
      toast({
        title: "Card number copied",
        description: "The card number has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy the card number to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className={`relative overflow-hidden bg-gradient-to-br ${gradient} text-white`}>
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
              <CardForm onSubmit={handleUpdate} defaultValues={card} />
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                className="text-xl font-mono focus:outline-none transition-opacity hover:opacity-80"
                onClick={() => setShowFullNumber(!showFullNumber)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  copyCardNumber();
                }}
                title={showFullNumber ? "Press and hold to copy, click to hide" : "Click to view full number"}
              >
                {formatCardNumber(card.cardNumber, card.cardNetwork, showFullNumber)}
              </button>
              {getCardIcon(card.cardNetwork)}
            </div>
            <div className="text-sm">
              <div className="opacity-75 text-xs mb-1">Expires</div>
              {card.expiryDate}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
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