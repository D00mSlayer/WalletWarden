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
import Passwords from "@/pages/passwords";
import Business from "@/pages/business";
import CustomerCredits from "@/pages/business/credits";
import Expenses from "@/pages/business/expenses";
import FixedExpenses from "@/pages/business/fixed-expenses";
import Sales from "@/pages/business/sales";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/credit-cards" component={CreditCards} />
      <ProtectedRoute path="/debit-cards" component={DebitCards} />
      <ProtectedRoute path="/bank-accounts" component={BankAccounts} />
      <ProtectedRoute path="/loans" component={Loans} />
      <ProtectedRoute path="/passwords" component={Passwords} />
      <ProtectedRoute path="/business" component={Business} />
      <ProtectedRoute path="/business/credits" component={CustomerCredits} />
      <ProtectedRoute path="/business/expenses" component={Expenses} />
      <ProtectedRoute path="/business/fixed-expenses" component={FixedExpenses} />
      <ProtectedRoute path="/business/sales" component={Sales} />
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