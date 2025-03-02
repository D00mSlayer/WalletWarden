import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

export default function Expenses() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/business" className="text-gray-600 hover:text-gray-900">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-primary">Business Expenses</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Expense tracking feature coming soon
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
