"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2, Check, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { expenseSchema, type ExpenseFormValues } from "@/lib/validations/expense";
import type { Category, OCRResult } from "@/lib/types";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface ReceiptReviewProps {
  ocrData: OCRResult & { receipt_id: string };
}

export function ReceiptReview({ ocrData }: ReceiptReviewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const catRes = await fetch("/api/categories");
      const cats = await catRes.json();
      setCategories(cats);

      // Find the suggested category
      const suggestedCat = cats.find(
        (c: Category) => c.name.toLowerCase() === ocrData.suggested_category.toLowerCase()
      );

      if (suggestedCat) {
        setValue("category_id", suggestedCat.id);
      }

      // Get receipt image URL
      const supabase = createClient();
      const { data: receipt } = await supabase
        .from("receipts")
        .select("image_path")
        .eq("id", ocrData.receipt_id)
        .single();

      if (receipt) {
        const { data } = supabase.storage
          .from("receipts")
          .getPublicUrl(receipt.image_path);
        // For private buckets, use createSignedUrl instead
        const { data: signedData } = await supabase.storage
          .from("receipts")
          .createSignedUrl(receipt.image_path, 3600);
        setImageUrl(signedData?.signedUrl || null);
      }
    };
    fetchData();
  }, [ocrData]);

  const { register, handleSubmit, control, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      vendor: ocrData.vendor,
      date: ocrData.date,
      amount: ocrData.total,
      subtotal: ocrData.subtotal,
      tax: ocrData.tax,
      tip: ocrData.tip,
      receipt_id: ocrData.receipt_id,
      is_verified: false,
      tag_ids: [],
      items: ocrData.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const onSubmit = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, is_verified: true }),
      });

      if (!res.ok) throw new Error("Failed to save expense");

      // Mark receipt as completed
      const supabase = createClient();
      await supabase
        .from("receipts")
        .update({ status: "completed" })
        .eq("id", ocrData.receipt_id);

      toast.success("Expense saved from receipt!");
      router.push("/expenses");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Receipt Image */}
      <Card className="lg:sticky lg:top-6 h-fit">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Receipt Image</CardTitle>
            <Badge variant={ocrData.confidence >= 0.8 ? "default" : "secondary"}>
              {Math.round(ocrData.confidence * 100)}% confidence
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {imageUrl ? (
            <div className="relative w-full overflow-auto max-h-[600px] rounded-md bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Receipt"
                className="w-full object-contain"
              />
            </div>
          ) : (
            <div className="w-full h-[400px] bg-muted rounded-md flex items-center justify-center">
              <p className="text-muted-foreground">Loading image...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right: Pre-filled Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Expense Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor</Label>
                <Input id="vendor" {...register("vendor")} />
                {errors.vendor && <p className="text-sm text-destructive">{errors.vendor.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" {...register("date")} />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subtotal">Subtotal</Label>
                <Input id="subtotal" type="number" step="0.01" {...register("subtotal")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax">Tax</Label>
                <Input id="tax" type="number" step="0.01" {...register("tax")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tip">Tip</Label>
                <Input id="tip" type="number" step="0.01" {...register("tip")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Total</Label>
                <Input id="amount" type="number" step="0.01" {...register("amount")} />
                {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category_id">Category</Label>
              <Select id="category_id" {...register("category_id")}>
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Line Items ({fields.length})</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ name: "", quantity: 1, unit_price: 0, total_price: 0 })}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {fields.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No items extracted from receipt.
              </p>
            ) : (
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <div className="flex-1">
                      <Input placeholder="Item" {...register(`items.${index}.name`)} />
                    </div>
                    <div className="w-16">
                      <Input type="number" step="1" placeholder="Qty" {...register(`items.${index}.quantity`)} />
                    </div>
                    <div className="w-24">
                      <Input type="number" step="0.01" placeholder="Price" {...register(`items.${index}.unit_price`)} />
                    </div>
                    <div className="w-24">
                      <Input type="number" step="0.01" placeholder="Total" {...register(`items.${index}.total_price`)} />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="animate-spin mr-2" /> : <Check className="mr-2 h-4 w-4" />}
            Save Expense
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/scan")}>
            Discard
          </Button>
        </div>
      </form>
    </div>
  );
}
