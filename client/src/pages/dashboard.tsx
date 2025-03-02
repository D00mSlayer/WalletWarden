import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { CreditCard, Wallet, Building2, FileText, CircleDollarSign, KeyRound, Store } from "lucide-react";

const tiles = [
  {
    title: "Credit Cards",
    icon: CreditCard,
    href: "/credit-cards",
    color: "text-blue-500",
  },
  {
    title: "Debit Cards",
    icon: Wallet,
    href: "/debit-cards",
    color: "text-green-500",
  },
  {
    title: "Bank Accounts",
    icon: Building2,
    href: "/bank-accounts",
    color: "text-purple-500",
  },
  {
    title: "Loans",
    icon: CircleDollarSign,
    href: "/loans",
    color: "text-orange-500",
  },
  {
    title: "Business",
    icon: Store,
    href: "/business",
    color: "text-pink-500",
  },
  {
    title: "Documents",
    icon: FileText,
    href: "/documents",
    color: "text-teal-500",
  },
  {
    title: "Passwords",
    icon: KeyRound,
    href: "/passwords",
    color: "text-gray-500",
  },
];

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Financial Tracker</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {user?.username}</span>
            <button
              onClick={() => logoutMutation.mutate()}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold mb-6">Financial Overview</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tiles.map((tile) => (
            <Link key={tile.title} href={tile.href}>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <tile.icon className={`h-6 w-6 ${tile.color}`} />
                    <span>{tile.title}</span>
                  </CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}