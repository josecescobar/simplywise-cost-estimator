import { useCallback, useEffect, useState } from "react";
import {
  fetchBudgetStatus,
  fetchExpenses,
  fetchProfile,
} from "@/lib/api";
import type {
  BudgetStatus,
  DashboardStats,
  Expense,
  Profile,
  SpendingByCategory,
} from "@/types";
import { useAuth } from "@/lib/auth-context";

export function useDashboardData() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    total_spent: 0,
    total_expenses: 0,
    avg_expense: 0,
    top_category: null,
  });
  const [recent, setRecent] = useState<Expense[]>([]);
  const [byCategory, setByCategory] = useState<SpendingByCategory[]>([]);
  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const firstOfMonth = new Date();
      firstOfMonth.setDate(1);
      const fromIso = firstOfMonth.toISOString().split("T")[0];

      const [p, monthExpenses, recentList, b] = await Promise.all([
        fetchProfile(user.id),
        fetchExpenses({ from: fromIso }),
        fetchExpenses({ limit: 5 }),
        fetchBudgetStatus(),
      ]);
      setProfile(p);
      setRecent(recentList);
      setBudgets(b);

      const total = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
      const count = monthExpenses.length;

      const catMap = new Map<
        string,
        { name: string; color: string; total: number; count: number }
      >();
      for (const exp of monthExpenses) {
        const key = exp.category?.id ?? "uncategorized";
        const name = exp.category?.name ?? "Uncategorized";
        const color = exp.category?.color ?? "#9ca3af";
        const existing = catMap.get(key) ?? { name, color, total: 0, count: 0 };
        existing.total += Number(exp.amount);
        existing.count += 1;
        catMap.set(key, existing);
      }
      const catList = Array.from(catMap.values())
        .map((c) => ({
          category_name: c.name,
          category_color: c.color,
          total: c.total,
          count: c.count,
          percentage: total > 0 ? (c.total / total) * 100 : 0,
        }))
        .sort((a, b) => b.total - a.total);

      setByCategory(catList);
      setStats({
        total_spent: total,
        total_expenses: count,
        avg_expense: count ? total / count : 0,
        top_category: catList[0]?.category_name ?? null,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return { profile, stats, recent, byCategory, budgets, loading, error, reload: load };
}
