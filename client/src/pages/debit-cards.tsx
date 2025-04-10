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
import { insertDebitCardSchema, cardNetworks, bankIssuers, type DebitCard } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, PlusCircle, Pencil, Trash2, X } from "lucide-react";
import { SiVisa, SiMastercard, SiAmericanexpress } from "react-icons/si";
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
import * as z from "zod";

type InsertDebitCard = z.infer<typeof insertDebitCardSchema>;

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
    resolver: zodResolver(insertDebitCardSchema),
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
      return <SiVisa className="h-8 w-8 text-white" />;
    case "Mastercard":
      return <SiMastercard className="h-8 w-8 text-white" />;
    case "American Express":
      return <SiAmericanexpress className="h-8 w-8 text-white" />;
    case "Rupay":
      return (
        <img
          src="/assets/icons/rupay.png"
          alt="RuPay"
          className="h-8 w-8 object-contain"
        />
      );
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

function DebitCardItem({ card, onUpdate, onDelete }: any) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showFullNumber, setShowFullNumber] = useState(false);
  const [showCVV, setShowCVV] = useState(false);
  const { toast } = useToast();
  const gradient = getCardGradient(card.cardNetwork);

  // Auto-hide number and CVV after 5 seconds
  useEffect(() => {
    if (showFullNumber || showCVV) {
      const timer = setTimeout(() => {
        setShowFullNumber(false);
        setShowCVV(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showFullNumber, showCVV]);

  const handleUpdate = async (data: any) => {
    await onUpdate(data);
    setIsEditOpen(false);
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      // Try using the modern Clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        toast({
          title: `${type} copied`,
          description: `The ${type.toLowerCase()} has been copied to your clipboard`,
        });
        return;
      }

      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        toast({
          title: `${type} copied`,
          description: `The ${type.toLowerCase()} has been copied to your clipboard`,
        });
      } catch (err) {
        toast({
          title: "Failed to copy",
          description: `Please copy the ${type.toLowerCase()} manually`,
          variant: "destructive",
        });
      } finally {
        document.body.removeChild(textArea);
      }
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: `Please copy the ${type.toLowerCase()} manually`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative">
      <Card className={`relative overflow-hidden bg-gradient-to-br ${gradient} text-white aspect-[1.586/1] max-w-[400px] mx-auto rounded-2xl shadow-lg transition-transform hover:scale-[1.02]`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        
        <div className="p-6 h-full flex flex-col relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-medium tracking-wide">{card.cardName}</h3>
              <p className="text-sm opacity-75">{card.issuer}</p>
            </div>
            <div className="flex gap-2">
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:text-white/80 relative z-20">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Debit Card</DialogTitle>
                  </DialogHeader>
                  <CardForm onSubmit={handleUpdate} defaultValues={card} />
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-white/80 relative z-20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Debit Card</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this debit card? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div className="mb-6">
              <div
                className="text-xl font-mono tracking-wider focus:outline-none transition-opacity hover:opacity-80 w-full text-left cursor-pointer relative z-20"
                onClick={() => setShowFullNumber(!showFullNumber)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (showFullNumber) copyToClipboard(card.cardNumber, "Card number");
                }}
                title={showFullNumber ? "Press and hold to copy, click to hide" : "Click to view full number"}
              >
                {formatCardNumber(card.cardNumber, card.cardNetwork, showFullNumber)}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs opacity-75">CVV</div>
                <div
                  className="font-mono tracking-wider focus:outline-none transition-opacity hover:opacity-80 cursor-pointer relative z-20"
                  onClick={() => setShowCVV(!showCVV)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (showCVV) copyToClipboard(card.cvv, "CVV");
                  }}
                  title={showCVV ? "Press and hold to copy, click to hide" : "Click to view CVV"}
                >
                  {showCVV ? card.cvv : "•••"}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs opacity-75">Expires</div>
                <div className="font-mono tracking-wider">{card.expiryDate}</div>
              </div>
              <div className="ml-8">
                {getCardIcon(card.cardNetwork)}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function DebitCards() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const { data: cards, isLoading } = useQuery<DebitCard[]>({
    queryKey: ["/api/debit-cards"],
  });

  const addCardMutation = useMutation({
    mutationFn: async (data: InsertDebitCard) => {
      const res = await apiRequest("POST", "/api/debit-cards", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/debit-cards"] });
      toast({ title: "Debit card added successfully" });
      setIsOpen(false);
    },
  });

  const updateCardMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertDebitCard }) => {
      const res = await apiRequest("PATCH", `/api/debit-cards/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/debit-cards"] });
      toast({ title: "Debit card updated successfully" });
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/debit-cards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/debit-cards"] });
      toast({ title: "Debit card deleted successfully" });
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
            <h1 className="text-2xl font-bold text-primary">Debit Cards</h1>
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
                <DialogTitle>Add Debit Card</DialogTitle>
              </DialogHeader>
              <CardForm onSubmit={(data: InsertDebitCard) => addCardMutation.mutate(data)} />
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
              No debit cards added yet
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards?.map((card) => (
              <DebitCardItem
                key={card.id}
                card={card}
                onUpdate={(data: InsertDebitCard) => updateCardMutation.mutate({ id: card.id, data })}
                onDelete={() => deleteCardMutation.mutate(card.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}