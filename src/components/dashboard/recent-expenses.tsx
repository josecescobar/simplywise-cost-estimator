"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Expense } from "@/lib/types";

interface RecentExpensesProps {
  expenses: Expense[];
}

export function RecentExpenses({ expenses }: RecentExpensesProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Expenses</CardTitle>
        <Link href="/expenses">
          <Button variant="ghost" size="sm">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No expenses yet. Add your first one!
          </p>
        ) : (
          <div className="space-y-4">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {expense.category && (
                    <div
                      className="w-2 h-8 rounded-full"
                      style={{ backgroundColor: expense.category.color }}
                    />
                  )}
                  <div>
                    <p className="font-medium text-sm">{expense.vendor}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(expense.date)}
                      {expense.category && ` · ${expense.category.name}`}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-sm">{formatCurrency(expense.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
