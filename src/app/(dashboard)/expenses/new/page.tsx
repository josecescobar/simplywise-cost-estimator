"use client";

import { useEffect, useState } from "react";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category, Tag } from "@/lib/types";

export default function NewExpensePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [catRes, tagRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/tags"),
      ]);
      setCategories(await catRes.json());
      setTags(await tagRes.json());
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return <ExpenseForm categories={categories} tags={tags} />;
}
