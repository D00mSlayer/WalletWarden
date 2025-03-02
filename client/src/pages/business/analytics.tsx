import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { DailySales, Expense } from "@shared/schema";
import { Loader2, TrendingUp, ArrowUpRight, IndianRupee, Receipt } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

function StatCard({ title, value, icon: Icon, trend }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold flex items-center">
          <IndianRupee className="h-4 w-4" />
          {value.toFixed(2)}
        </div>
        {trend && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3 text-green-500" />
            {trend}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const { data: sales, isLoading: salesLoading } = useQuery<DailySales[]>({
    queryKey: ["/api/business/sales"],
  });

  const { data: expenses, isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ["/api/business/expenses"],
  });

  if (salesLoading || expensesLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Get the last 6 months
  const monthRange = eachMonthOfInterval({
    start: subMonths(new Date(), 5),
    end: new Date(),
  });

  // Process monthly data
  const monthlyData = monthRange.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    // Calculate total sales for the month
    const monthlySales = sales?.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= monthStart && saleDate <= monthEnd;
    }).reduce((sum, sale) => sum + Number(sale.totalAmount), 0) || 0;

    // Calculate total expenses for the month
    const monthlyExpenses = expenses?.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= monthStart && expenseDate <= monthEnd;
    }).reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;

    // Calculate profit (35% margin of sales)
    const profit = monthlySales * 0.35;

    return {
      month: format(month, "MMM yy"),
      sales: monthlySales,
      expenses: monthlyExpenses,
      profit: profit,
    };
  });

  // Calculate current month metrics
  const currentMonthData = monthlyData[monthlyData.length - 1];
  const lastMonthData = monthlyData[monthlyData.length - 2];

  // Calculate trends
  const salesTrend = lastMonthData.sales 
    ? ((currentMonthData.sales - lastMonthData.sales) / lastMonthData.sales) * 100 
    : 0;

  const profitTrend = lastMonthData.profit
    ? ((currentMonthData.profit - lastMonthData.profit) / lastMonthData.profit) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/business" className="text-gray-600 hover:text-gray-900">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-primary">Business Analytics</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Current Month Sales"
            value={currentMonthData.sales}
            icon={TrendingUp}
            trend={salesTrend.toFixed(1)}
          />
          <StatCard
            title="Current Month Expenses"
            value={currentMonthData.expenses}
            icon={Receipt}
          />
          <StatCard
            title="Projected Profit"
            value={currentMonthData.profit}
            icon={TrendingUp}
            trend={profitTrend.toFixed(1)}
          />
        </div>

        {/* Sales Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.3}
                    name="Sales"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Profit vs Expenses Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Profit vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, '']}
                  />
                  <Legend />
                  <Bar dataKey="profit" fill="#4ade80" name="Projected Profit" />
                  <Bar dataKey="expenses" fill="#f87171" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
