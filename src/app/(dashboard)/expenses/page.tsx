"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpenseTable } from "@/components/expenses/expense-table";
import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { Skeleton } from "@/components/ui/skeleton";
import type { Expense, Category } from "@/lib/types";

function ExpensesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0 });

  const sortBy = searchParams.get("sort_by") || "date";
  const sortOrder = searchParams.get("sort_order") || "desc";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      const [expRes, catRes] = await Promise.all([
        fetch(`/api/expenses?${params.toString()}`),
        fetch("/api/categories"),
      ]);
      const expData = await expRes.json();
      const catData = await catRes.json();
      setExpenses(expData.data || []);
      setPagination(expData.pagination || { page: 1, total_pages: 1, total: 0 });
      setCategories(catData || []);
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (column: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sortBy === column) {
      params.set("sort_order", sortOrder === "asc" ? "desc" : "asc");
    } else {
      params.set("sort_by", column);
      params.set("sort_order", "desc");
    }
    router.push(`/expenses?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">
            {pagination.total} expense{pagination.total !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link href="/expenses/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </Link>
      </div>

      <ExpenseFilters categories={categories} />

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <ExpenseTable
          expenses={expenses}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      )}

      {pagination.total_pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={page === pagination.page ? "default" : "outline"}
              size="sm"
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", page.toString());
                router.push(`/expenses?${params.toString()}`);
              }}
            >
              {page}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={<div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>}>
      <ExpensesContent />
    </Suspense>
  );
}
