"use client";

import { useEffect, useState, use } from "react";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category, Tag, Expense } from "@/lib/types";

export default function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [expense, setExpense] = useState<Expense | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [expRes, catRes, tagRes] = await Promise.all([
        fetch(`/api/expenses/${id}`),
        fetch("/api/categories"),
        fetch("/api/tags"),
      ]);
      setExpense(await expRes.json());
      setCategories(await catRes.json());
      setTags(await tagRes.json());
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!expense) {
    return <p className="text-muted-foreground">Expense not found.</p>;
  }

  return <ExpenseForm expense={expense} categories={categories} tags={tags} />;
}
