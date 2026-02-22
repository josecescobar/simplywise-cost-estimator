"use client";

import { AlertTriangle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrency } from "@/hooks/use-currency";
import { formatCurrency } from "@/lib/utils";
import type { BudgetStatus } from "@/lib/types";

interface BudgetOverviewProps {
  budgets: BudgetStatus[];
}

export function BudgetOverview({ budgets }: BudgetOverviewProps) {
  const currency = useCurrency();

  if (budgets.length === 0) return null;

  const exceeded = budgets.filter((b) => b.status === "exceeded");
  const warnings = budgets.filter((b) => b.status === "warning");

  const statusColor = (status: string) => {
    if (status === "exceeded") return "bg-red-500";
    if (status === "warning") return "bg-amber-500";
    return "bg-green-500";
  };

  const statusTrack = (status: string) => {
    if (status === "exceeded") return "bg-red-100 dark:bg-red-950";
    if (status === "warning") return "bg-amber-100 dark:bg-amber-950";
    return "bg-green-100 dark:bg-green-950";
  };

  return (
    <div className="space-y-4">
      {/* Alert banners */}
      {exceeded.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            Budget exceeded: {exceeded.map((b) =>
              b.budget.category_id ? b.budget.category?.name : "Overall"
            ).join(", ")}
          </span>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Approaching limit: {warnings.map((b) =>
              b.budget.category_id ? b.budget.category?.name : "Overall"
            ).join(", ")}
          </span>
        </div>
      )}

      {/* Progress card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Budget Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {budgets.map((bs) => {
            const label = bs.budget.category_id
              ? bs.budget.category?.name ?? "Category"
              : "Overall";
            const color = bs.budget.category?.color;

            return (
              <div key={bs.budget.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {color && (
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    )}
                    <span className="font-medium">{label}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {formatCurrency(bs.spent, currency)} / {formatCurrency(bs.budget.amount, currency)}
                  </span>
                </div>
                <div className={`h-2 rounded-full ${statusTrack(bs.status)}`}>
                  <div
                    className={`h-full rounded-full transition-all ${statusColor(bs.status)}`}
                    style={{ width: `${Math.min(bs.percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
