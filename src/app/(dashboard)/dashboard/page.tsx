"use client";

import { useState, useEffect } from "react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { RecentExpenses } from "@/components/dashboard/recent-expenses";
import { BudgetOverview } from "@/components/dashboard/budget-overview";
import { Skeleton } from "@/components/ui/skeleton";
import type { BudgetStatus } from "@/lib/types";

export default function DashboardPage() {
  const [data, setData] = useState<{
    stats: { total_spent: number; total_expenses: number; avg_expense: number; top_category: string | null };
    by_category: { category_name: string; category_color: string; total: number; count: number; percentage: number }[];
    by_month: { month: string; total: number; count: number }[];
    recent: Array<Record<string, unknown>>;
  } | null>(null);
  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportsRes, budgetsRes] = await Promise.all([
          fetch("/api/reports"),
          fetch("/api/budgets"),
        ]);
        const json = await reportsRes.json();
        const budgetData = await budgetsRes.json();
        setData(json);
        setBudgets(Array.isArray(budgetData) ? budgetData : []);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[380px]" />
          <Skeleton className="h-[380px]" />
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground">Failed to load dashboard data.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <BudgetOverview budgets={budgets} />

      <StatsCards stats={data.stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <SpendingChart data={data.by_month} />
        <CategoryBreakdown data={data.by_category} />
      </div>

      <RecentExpenses expenses={data.recent as never[]} />
    </div>
  );
}
