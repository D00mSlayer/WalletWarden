import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Store, UserSquare2, Receipt, Wallet2, LineChart } from "lucide-react";

const sections = [
  {
    title: "Customer Credits",
    description: "Track pending payments from customers",
    href: "/business/credits",
    icon: UserSquare2,
    color: "text-blue-500",
  },
  {
    title: "Expenses",
    description: "Manage and track business expenses",
    href: "/business/expenses",
    icon: Receipt,
    color: "text-orange-500",
  },
  {
    title: "Fixed Expenses",
    description: "Track salaries, rent, and utilities",
    href: "/business/fixed-expenses",
    icon: Wallet2,
    color: "text-purple-500",
  },
  {
    title: "Daily Sales",
    description: "Record and monitor daily sales",
    href: "/business/sales",
    icon: LineChart,
    color: "text-green-500",
  },
];

export default function Business() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-primary">Business Dashboard</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section) => (
            <Link key={section.title} href={section.href}>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <section.icon className={`h-6 w-6 ${section.color}`} />
                    <span>{section.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{section.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
