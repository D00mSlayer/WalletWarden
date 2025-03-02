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
import { insertPasswordSchema, type Password } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, PlusCircle, Pencil, Trash2, Eye, EyeOff, Copy } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";

function PasswordForm({ onSubmit, defaultValues }: any) {
  const form = useForm({
    resolver: zodResolver(insertPasswordSchema),
    defaultValues: {
      personName: defaultValues?.personName || "",
      serviceName: defaultValues?.serviceName || "",
      username: defaultValues?.username || "",
      password: defaultValues?.password || "",
      isActualPassword: defaultValues?.isActualPassword || false,
      notes: defaultValues?.notes || "",
    },
    mode: "onChange",
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="personName">Person Name</Label>
        <Input
          id="personName"
          {...form.register("personName")}
        />
        {form.formState.errors.personName && (
          <p className="text-sm text-red-500">{form.formState.errors.personName.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="serviceName">Service/Website Name</Label>
        <Input
          id="serviceName"
          {...form.register("serviceName")}
        />
        {form.formState.errors.serviceName && (
          <p className="text-sm text-red-500">{form.formState.errors.serviceName.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="username">Username/Email</Label>
        <Input
          id="username"
          {...form.register("username")}
        />
        {form.formState.errors.username && (
          <p className="text-sm text-red-500">{form.formState.errors.username.message as string}</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="password">Password/Pattern</Label>
          <div className="flex items-center space-x-2">
            <Switch
              id="isActualPassword"
              checked={form.watch("isActualPassword")}
              onCheckedChange={(value) => form.setValue("isActualPassword", value)}
            />
            <Label htmlFor="isActualPassword" className="text-sm">
              Actual Password
            </Label>
          </div>
        </div>
        <Input
          id="password"
          type={form.watch("isActualPassword") ? "password" : "text"}
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-red-500">{form.formState.errors.password.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Input
          id="notes"
          {...form.register("notes")}
        />
      </div>

      <Button type="submit" className="w-full">
        {defaultValues ? "Update Password" : "Add Password"}
      </Button>
    </form>
  );
}

function PasswordCard({ password, onUpdate, onDelete }: any) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  // Auto-hide password after 5 seconds
  useEffect(() => {
    if (showPassword && password.isActualPassword) {
      const timer = setTimeout(() => {
        setShowPassword(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showPassword, password.isActualPassword]);

  const handleUpdate = async (data: any) => {
    await onUpdate(data);
    setIsEditOpen(false);
  };

  const copyToClipboard = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: `${what} copied`,
        description: `The ${what.toLowerCase()} has been copied to your clipboard`,
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-4">
        <div>
          <CardTitle className="text-lg font-normal mb-1">{password.serviceName}</CardTitle>
          <div className="text-sm text-muted-foreground">{password.personName}</div>
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
                <DialogTitle>Edit Password</DialogTitle>
              </DialogHeader>
              <PasswordForm onSubmit={handleUpdate} defaultValues={password} />
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
                <AlertDialogTitle>Delete Password</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this password? This action cannot be undone.
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
          <div>
            <div className="text-sm font-medium mb-1">Username/Email</div>
            <div className="flex items-center gap-2">
              <span className="font-mono">{password.username}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => copyToClipboard(password.username, "Username")}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">
                {password.isActualPassword ? "Password" : "Password Pattern"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6"
                onClick={() => password.isActualPassword ? setShowPassword(!showPassword) : copyToClipboard(password.password, "Password")}
              >
                {password.isActualPassword ? (
                  showPassword ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />
                ) : (
                  <Copy className="h-3 w-3 mr-1" />
                )}
                {password.isActualPassword ? (showPassword ? "Hide" : "Show") : "Copy"}
              </Button>
            </div>
            <div className="font-mono">
              {password.isActualPassword
                ? showPassword
                  ? password.password
                  : "••••••••"
                : password.password}
            </div>
          </div>

          {password.notes && (
            <div>
              <div className="text-sm font-medium mb-1">Notes</div>
              <div className="text-sm text-muted-foreground">{password.notes}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function groupPasswordsByPerson(passwords: Password[]) {
  return passwords.reduce((groups: { [key: string]: Password[] }, password) => {
    const person = password.personName;
    if (!groups[person]) {
      groups[person] = [];
    }
    groups[person].push(password);
    return groups;
  }, {});
}

export default function Passwords() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const { data: passwords, isLoading } = useQuery<Password[]>({
    queryKey: ["/api/passwords"],
  });

  const addPasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/passwords", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/passwords"] });
      toast({ title: "Password added successfully" });
      setIsOpen(false);
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/passwords/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/passwords"] });
      toast({ title: "Password updated successfully" });
    },
  });

  const deletePasswordMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/passwords/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/passwords"] });
      toast({ title: "Password deleted successfully" });
    },
  });

  const groupedPasswords = groupPasswordsByPerson(passwords || []);
  const persons = Object.keys(groupedPasswords).sort();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-primary">Passwords</h1>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Password
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Password</DialogTitle>
              </DialogHeader>
              <PasswordForm onSubmit={(data) => addPasswordMutation.mutate(data)} />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : persons.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No passwords added yet
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {persons.map((person) => (
              <div key={person}>
                <h2 className="text-lg font-medium mb-4 text-muted-foreground">
                  {person}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {groupedPasswords[person].map((password: any) => (
                    <PasswordCard
                      key={password.id}
                      password={password}
                      onUpdate={(data) => updatePasswordMutation.mutate({ id: password.id, data })}
                      onDelete={() => deletePasswordMutation.mutate(password.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}