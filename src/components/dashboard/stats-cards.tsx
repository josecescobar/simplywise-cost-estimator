"use client";

import { DollarSign, Receipt, TrendingUp, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { DashboardStats } from "@/lib/types";

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Spent",
      value: formatCurrency(stats.total_spent),
      icon: DollarSign,
      description: "All time total",
    },
    {
      title: "Total Expenses",
      value: stats.total_expenses.toString(),
      icon: Receipt,
      description: "Number of expenses",
    },
    {
      title: "Average Expense",
      value: formatCurrency(stats.avg_expense),
      icon: TrendingUp,
      description: "Per transaction",
    },
    {
      title: "Top Category",
      value: stats.top_category || "—",
      icon: Tag,
      description: "Most spending",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
