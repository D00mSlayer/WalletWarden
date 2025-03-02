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
import { insertBankAccountSchema, bankIssuers, type BankAccount } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, PlusCircle, Pencil, Trash2, Copy } from "lucide-react";
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

function formatAccountNumber(number: string, showFull: boolean = false): string {
  if (!showFull) {
    return `•••••••${number.slice(-4)}`;
  }
  return number;
}

function AccountForm({ onSubmit, defaultValues }: any) {
  const form = useForm({
    resolver: zodResolver(insertBankAccountSchema),
    defaultValues: {
      bankName: defaultValues?.bankName || "",
      accountNumber: defaultValues?.accountNumber || "",
      customerId: defaultValues?.customerId || "",
      ifscCode: defaultValues?.ifscCode || "",
      netBankingPassword: defaultValues?.netBankingPassword || "",
      mpin: defaultValues?.mpin || "",
    },
    mode: "onChange",
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="bankName">Bank Name</Label>
        <Select
          value={form.watch("bankName")}
          onValueChange={(value) => form.setValue("bankName", value, { shouldValidate: true })}
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
          placeholder="e.g., HDFC0000123"
        />
        {form.formState.errors.ifscCode && (
          <p className="text-sm text-red-500">{form.formState.errors.ifscCode.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="netBankingPassword">Net Banking Password (Optional)</Label>
        <Input
          id="netBankingPassword"
          type="password"
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
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          {...form.register("mpin")}
        />
        {form.formState.errors.mpin && (
          <p className="text-sm text-red-500">{form.formState.errors.mpin.message as string}</p>
        )}
      </div>

      <Button type="submit" className="w-full">
        {defaultValues ? "Update Account" : "Add Account"}
      </Button>
    </form>
  );
}

function BankAccountItem({ account, onUpdate, onDelete }: any) {
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

  const handleUpdate = async (data: any) => {
    await onUpdate(data);
    setIsEditOpen(false);
  };

  const copyAccountNumber = async () => {
    if (!showFullNumber) return;

    try {
      await navigator.clipboard.writeText(account.accountNumber);
      toast({
        title: "Account number copied",
        description: "The account number has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy the account number to clipboard",
        variant: "destructive",
      });
    }
  };

  const copyIfscCode = async () => {
    try {
      await navigator.clipboard.writeText(account.ifscCode);
      toast({
        title: "IFSC code copied",
        description: "The IFSC code has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy the IFSC code to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-8">
        <div>
          <CardTitle className="text-lg font-normal mb-1">{account.bankName}</CardTitle>
        </div>
        <div className="flex gap-2">
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Bank Account</DialogTitle>
              </DialogHeader>
              <AccountForm onSubmit={handleUpdate} defaultValues={account} />
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash2 className="h-4 w-4" />
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
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                className="text-base font-mono focus:outline-none transition-opacity hover:opacity-80"
                onClick={() => setShowFullNumber(!showFullNumber)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  copyAccountNumber();
                }}
                title={showFullNumber ? "Press and hold to copy, click to hide" : "Click to view full number"}
              >
                {formatAccountNumber(account.accountNumber, showFullNumber)}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">IFSC:</span>
            <span className="text-sm font-mono">{account.ifscCode}</span>
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

  const addAccountMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/bank-accounts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      toast({ title: "Bank account added successfully" });
      setIsOpen(false);
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
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
