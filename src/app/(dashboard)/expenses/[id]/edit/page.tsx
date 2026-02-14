"use client";

import { useEffect, useState, use } from "react";
import { Receipt, ChevronDown, ChevronUp } from "lucide-react";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Category, Tag, Expense } from "@/lib/types";

export default function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [expense, setExpense] = useState<Expense | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiptImageUrl, setReceiptImageUrl] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [expRes, catRes, tagRes] = await Promise.all([
        fetch(`/api/expenses/${id}`),
        fetch("/api/categories"),
        fetch("/api/tags"),
      ]);
      const expData = await expRes.json();
      setExpense(expData);
      setCategories(await catRes.json());
      setTags(await tagRes.json());

      // Generate signed URL for receipt image
      if (expData.receipt?.image_path) {
        const supabase = createClient();
        const { data } = await supabase.storage
          .from("receipts")
          .createSignedUrl(expData.receipt.image_path, 3600);
        if (data?.signedUrl) {
          setReceiptImageUrl(data.signedUrl);
        }
      }

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

  if (!receiptImageUrl) {
    return <ExpenseForm expense={expense} categories={categories} tags={tags} />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Receipt className="h-5 w-5" />
              Receipt Image
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReceipt(!showReceipt)}
            >
              {showReceipt ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {showReceipt && (
          <CardContent>
            <img
              src={receiptImageUrl}
              alt="Receipt"
              className="w-full rounded-lg border"
            />
          </CardContent>
        )}
      </Card>

      <div>
        <ExpenseForm expense={expense} categories={categories} tags={tags} className="max-w-none" />
      </div>
    </div>
  );
}
