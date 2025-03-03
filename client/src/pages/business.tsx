import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Store, UserSquare2, Receipt, LineChart, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { type CustomerCredit } from "@shared/schema";

const sections = [
  {
    title: "Customer Credits",
    description: "Track pending payments from customers",
    href: "/business/credits",
    icon: UserSquare2,
    color: "text-blue-500",
    showBadge: true,
  },
  {
    title: "Expenses",
    description: "Manage and track business expenses",
    href: "/business/expenses",
    icon: Receipt,
    color: "text-orange-500",
  },
  {
    title: "Daily Sales",
    description: "Record and monitor daily sales",
    href: "/business/sales",
    icon: LineChart,
    color: "text-green-500",
  },
  {
    title: "Analytics",
    description: "View business performance metrics",
    href: "/business/analytics",
    icon: BarChart3,
    color: "text-purple-500",
  },
];

export default function Business() {
  // Fetch pending customer credits
  const { data: credits } = useQuery<CustomerCredit[]>({
    queryKey: ["/api/business/credits"],
  });

  // Calculate pending credits count
  const pendingCredits = credits?.filter(credit => credit.status === "pending").length || 0;

  // Get badge count for sections
  const getBadgeCount = (title: string) => {
    if (title === "Customer Credits") return pendingCredits;
    return 0;
  };

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
                    {section.showBadge && getBadgeCount(section.title) > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {getBadgeCount(section.title)}
                      </Badge>
                    )}
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