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
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBankAccountSchema, bankIssuers, accountTypes, type BankAccount, type InsertBankAccount } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, PlusCircle, Pencil, Trash2, Copy, X, Eye, EyeOff, Building2, CreditCard, User2, Tag, KeyRound, LockKeyhole } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useState, useEffect } from "react";
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

// Define a type for the form values that's compatible with both the schema and BankAccount
type BankAccountFormData = {
  bankName: typeof bankIssuers[number];
  accountType: typeof accountTypes[number];
  accountNumber: string;
  customerId: string;
  ifscCode: string;
  netBankingPassword: string;
  mpin: string;
  tags: string[];
};

function formatAccountNumber(number: string, showFull: boolean = false): string {
  if (!showFull) {
    return `•••••••${number.slice(-4)}`;
  }
  return number;
}

interface AccountFormProps {
  onSubmit: SubmitHandler<BankAccountFormData>;
  defaultValues?: Partial<BankAccount>;
}

// Add a utility function to handle mobile-friendly copying/sharing
const copyToClipboard = async (text: string, fallbackTitle: string, toast: any) => {
  try {
    // Use the document.execCommand approach which works more reliably across browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Make the textarea out of viewport
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) {
      toast({
        title: "Copied to clipboard",
        description: `${fallbackTitle} has been copied to your clipboard`,
      });
      return true;
    } else {
      // Try the navigator.clipboard API as fallback
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: `${fallbackTitle} has been copied to your clipboard`,
      });
      return true;
    }
  } catch (err) {
    // Neither approach worked, try share API as final fallback on mobile
    if (navigator.share) {
      try {
        await navigator.share({
          text: text,
        });
        toast({
          title: "Shared successfully",
          description: `${fallbackTitle} has been shared`,
        });
        return true;
      } catch (error) {
        // User cancelled or share API failed
        const shareError = error as { name?: string };
        if (shareError.name !== 'AbortError') {
          toast({
            title: "Couldn't share",
            description: "Sharing was cancelled or failed",
            variant: "destructive",
          });
        }
        return false;
      }
    } else {
      toast({
        title: "Copy not supported",
        description: "Your browser doesn't support copying to clipboard",
        variant: "destructive",
      });
      return false;
    }
  }
};

function AccountForm({ onSubmit, defaultValues }: AccountFormProps) {
  const form = useForm<BankAccountFormData>({
    resolver: zodResolver(insertBankAccountSchema),
    defaultValues: {
      bankName: defaultValues?.bankName as typeof bankIssuers[number],
      accountType: defaultValues?.accountType as typeof accountTypes[number],
      accountNumber: defaultValues?.accountNumber || "",
      customerId: defaultValues?.customerId || "",
      ifscCode: defaultValues?.ifscCode || "",
      netBankingPassword: defaultValues?.netBankingPassword || "",
      mpin: defaultValues?.mpin || "",
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

  const handleIfscChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    form.setValue("ifscCode", value, { shouldValidate: true });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="bankName">Bank Name</Label>
        <Select
          value={form.watch("bankName")}
          onValueChange={(value: typeof bankIssuers[number]) => 
            form.setValue("bankName", value, { shouldValidate: true })
          }
        >
          <SelectTrigger>
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
        {form.formState.errors.bankName && (
          <p className="text-sm text-red-500">{form.formState.errors.bankName.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="accountType">Account Type</Label>
        <Select
          value={form.watch("accountType")}
          onValueChange={(value: typeof accountTypes[number]) => 
            form.setValue("accountType", value, { shouldValidate: true })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select account type" />
          </SelectTrigger>
          <SelectContent>
            {accountTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.accountType && (
          <p className="text-sm text-red-500">{form.formState.errors.accountType.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="accountNumber">Account Number</Label>
        <Input
          id="accountNumber"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          {...form.register("accountNumber")}
        />
        {form.formState.errors.accountNumber && (
          <p className="text-sm text-red-500">{form.formState.errors.accountNumber.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="customerId">Customer ID (Optional)</Label>
        <Input
          id="customerId"
          type="text"
          {...form.register("customerId")}
        />
        {form.formState.errors.customerId && (
          <p className="text-sm text-red-500">{form.formState.errors.customerId.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="ifscCode">IFSC Code</Label>
        <Input
          id="ifscCode"
          type="text"
          {...form.register("ifscCode")}
          onChange={handleIfscChange}
          placeholder="e.g., HDFC0000123"
          autoCapitalize="characters"
        />
        {form.formState.errors.ifscCode && (
          <p className="text-sm text-red-500">{form.formState.errors.ifscCode.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="netBankingPassword">Net Banking Password Pattern (Optional)</Label>
        <Input
          id="netBankingPassword"
          type="text"
          {...form.register("netBankingPassword")}
        />
        {form.formState.errors.netBankingPassword && (
          <p className="text-sm text-red-500">{form.formState.errors.netBankingPassword.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="mpin">MPIN (Optional)</Label>
        <Input
          id="mpin"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          {...form.register("mpin")}
        />
        {form.formState.errors.mpin && (
          <p className="text-sm text-red-500">{form.formState.errors.mpin.message as string}</p>
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
        {defaultValues ? "Update Account" : "Add Account"}
      </Button>
    </form>
  );
}

interface BankAccountItemProps {
  account: BankAccount;
  onUpdate: (data: BankAccountFormData) => void;
  onDelete: () => void;
}

function BankAccountItem({ account, onUpdate, onDelete }: BankAccountItemProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showFullNumber, setShowFullNumber] = useState(false);
  const { toast } = useToast();

  // Auto-hide number after 5 seconds
  useEffect(() => {
    if (showFullNumber) {
      const timer = setTimeout(() => {
        setShowFullNumber(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showFullNumber]);

  const handleUpdate = (data: BankAccountFormData) => {
    onUpdate(data);
    setIsEditOpen(false);
  };

  const copyAccountNumber = async () => {
    await copyToClipboard(account.accountNumber, "Account number", toast);
  };

  const copyIfscCode = async () => {
    await copyToClipboard(account.ifscCode, "IFSC code", toast);
  };
  
  // Function to generate a color based on bank name for consistent bank colors
  const getBankColor = (bankName: string) => {
    const bankColors: Record<string, string> = {
      "ICICI Bank": "from-orange-600 to-red-800",
      "HDFC Bank": "from-blue-800 to-blue-600",
      "SBI Bank": "from-blue-700 to-indigo-800",
      "Axis Bank": "from-purple-700 to-purple-900",
      "Kotak Mahindra Bank": "from-red-700 to-red-900",
      "YES Bank": "from-blue-600 to-blue-800",
      "American Express": "from-emerald-700 to-emerald-900",
      "IndusInd Bank": "from-indigo-600 to-violet-800",
      "IDFC Bank": "from-teal-700 to-teal-900",
    };
    
    return bankColors[bankName as keyof typeof bankColors] || "from-slate-700 to-slate-900";
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className={`bg-gradient-to-r ${getBankColor(account.bankName)} h-36 relative`}>
        <div className="absolute inset-0 p-6 text-white flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <Building2 className="h-6 w-6 mr-2" />
              <h3 className="text-xl font-semibold truncate max-w-[200px]">{account.bankName}</h3>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20 rounded-full" onClick={() => setIsEditOpen(true)}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20 rounded-full">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Bank Account</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this bank account? This action cannot be undone.
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
          
          <div className="flex flex-col">
            <div className="text-sm opacity-80 mb-1">{account.accountType}</div>
            <div className="flex items-center gap-2">
              <div 
                className="text-xl font-mono tracking-wider cursor-pointer"
                onClick={() => setShowFullNumber(!showFullNumber)}
                title={showFullNumber ? "Click to hide" : "Click to view full number"}
              >
                {formatAccountNumber(account.accountNumber, showFullNumber)}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/20 rounded-full"
                onClick={() => setShowFullNumber(!showFullNumber)}
                title={showFullNumber ? "Hide account number" : "Show account number"}
              >
                {showFullNumber ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
              {showFullNumber && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/20 rounded-full"
                  onClick={copyAccountNumber}
                  title="Copy account number"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <CardContent className="pt-6 pb-5">
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Bank Account</DialogTitle>
            </DialogHeader>
            <AccountForm onSubmit={handleUpdate} defaultValues={account} />
          </DialogContent>
        </Dialog>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <User2 className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                <span>Customer ID</span>
              </div>
              <div className="font-medium">
                {account.customerId || "—"}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-muted-foreground">
                  <CreditCard className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                  <span>IFSC Code</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={copyIfscCode}
                  title="Copy IFSC code"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="font-mono text-sm cursor-pointer" onClick={copyIfscCode} title="Click to copy">
                {account.ifscCode}
              </div>
            </div>
          </div>
          
          {(account.netBankingPassword || account.mpin) && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              {account.netBankingPassword && (
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <KeyRound className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                    <span>Password Pattern</span>
                  </div>
                  <div className="font-mono text-sm">{account.netBankingPassword}</div>
                </div>
              )}
              
              {account.mpin && (
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <LockKeyhole className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                    <span>MPIN</span>
                  </div>
                  <div className="font-mono text-sm">{account.mpin}</div>
                </div>
              )}
            </div>
          )}
          
          {account.tags && account.tags.length > 0 && (
            <div className="pt-2 border-t">
              <div className="flex items-center mb-2 text-sm text-muted-foreground">
                <Tag className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                <span>Tags</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {account.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function BankAccounts() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const { data: accounts, isLoading } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
  });

  const addAccountMutation = useMutation<any, Error, BankAccountFormData>({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", "/api/bank-accounts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      toast({ title: "Bank account added successfully" });
      setIsOpen(false);
    },
  });

  const updateAccountMutation = useMutation<any, Error, { id: number; data: BankAccountFormData }>({
    mutationFn: async ({ id, data }) => {
      const res = await apiRequest("PATCH", `/api/bank-accounts/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      toast({ title: "Bank account updated successfully" });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/bank-accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      toast({ title: "Bank account deleted successfully" });
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
            <h1 className="text-2xl font-bold text-primary">Bank Accounts</h1>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Bank Account</DialogTitle>
              </DialogHeader>
              <AccountForm onSubmit={(data) => addAccountMutation.mutate(data)} />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : accounts?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No bank accounts added yet
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts?.map((account) => (
              <BankAccountItem
                key={account.id}
                account={account}
                onUpdate={(data) => updateAccountMutation.mutate({ id: account.id, data })}
                onDelete={() => deleteAccountMutation.mutate(account.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}