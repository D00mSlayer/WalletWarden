import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import CreditCards from "@/pages/credit-cards";
import DebitCards from "@/pages/debit-cards";
import BankAccounts from "@/pages/bank-accounts";
import Loans from "@/pages/loans";
import Passwords from "@/pages/passwords"; // Added import

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/credit-cards" component={CreditCards} />
      <ProtectedRoute path="/debit-cards" component={DebitCards} />
      <ProtectedRoute path="/bank-accounts" component={BankAccounts} />
      <ProtectedRoute path="/loans" component={Loans} />
      <ProtectedRoute path="/passwords" component={Passwords} /> {/* Added route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;