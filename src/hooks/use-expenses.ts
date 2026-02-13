"use client";

import { useState, useEffect, useCallback } from "react";
import type { Expense } from "@/lib/types";

interface UseExpensesOptions {
  category_id?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  per_page?: number;
}

interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export function useExpenses(options: UseExpensesOptions = {}) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.set(key, String(value));
        }
      });

      const res = await fetch(`/api/expenses?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch expenses");

      const data = await res.json();
      setExpenses(data.data || []);
      setPagination(data.pagination || { page: 1, per_page: 20, total: 0, total_pages: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(options)]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return { expenses, pagination, loading, error, refetch: fetchExpenses };
}
