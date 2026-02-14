"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { expenseSchema, type ExpenseFormValues } from "@/lib/validations/expense";
import type { Category, Tag, Expense } from "@/lib/types";
import { toast } from "sonner";

interface ExpenseFormProps {
  expense?: Expense;
  categories: Category[];
  tags: Tag[];
  className?: string;
}

export function ExpenseForm({ expense, categories, tags, className }: ExpenseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEditing = !!expense;

  const { register, handleSubmit, control, formState: { errors }, watch, setValue } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      vendor: expense?.vendor || "",
      description: expense?.description || "",
      amount: expense?.amount || 0,
      subtotal: expense?.subtotal || null,
      tax: expense?.tax || null,
      tip: expense?.tip || null,
      date: expense?.date || new Date().toISOString().split("T")[0],
      category_id: expense?.category_id || null,
      receipt_id: expense?.receipt_id || null,
      is_verified: expense?.is_verified || false,
      tag_ids: expense?.tags?.map((t) => t.id) || [],
      items: expense?.items || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const subtotal = watch("subtotal");
  const tax = watch("tax");
  const tip = watch("tip");

  useEffect(() => {
    const sub = Number(subtotal) || 0;
    const t = Number(tax) || 0;
    const tp = Number(tip) || 0;
    if (sub > 0) {
      setValue("amount", Number((sub + t + tp).toFixed(2)));
    }
  }, [subtotal, tax, tip, setValue]);

  const onSubmit = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      const url = isEditing ? `/api/expenses/${expense.id}` : "/api/expenses";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save expense");
      }

      toast.success(isEditing ? "Expense updated!" : "Expense created!");
      router.push("/expenses");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const [selectedTags, setSelectedTags] = useState<string[]>(
    expense?.tags?.map((t) => t.id) || []
  );

  const toggleTag = (tagId: string) => {
    const updated = selectedTags.includes(tagId)
      ? selectedTags.filter((id) => id !== tagId)
      : [...selectedTags, tagId];
    setSelectedTags(updated);
    setValue("tag_ids", updated);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn("space-y-6 max-w-2xl", className)}>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Expense" : "New Expense"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor *</Label>
              <Input id="vendor" placeholder="Store name" {...register("vendor")} />
              {errors.vendor && <p className="text-sm text-destructive">{errors.vendor.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" type="date" {...register("date")} />
              {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Optional description" {...register("description")} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subtotal">Subtotal</Label>
              <Input id="subtotal" type="number" step="0.01" placeholder="0.00" {...register("subtotal", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax">Tax</Label>
              <Input id="tax" type="number" step="0.01" placeholder="0.00" {...register("tax", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tip">Tip</Label>
              <Input id="tip" type="number" step="0.01" placeholder="0.00" {...register("tip", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Total *</Label>
              <Input id="amount" type="number" step="0.01" placeholder="0.00" {...register("amount", { valueAsNumber: true })} />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category_id">Category</Label>
            <Select id="category_id" {...register("category_id")}>
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>

          {tags.length > 0 && (
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                      selectedTags.includes(tag.id)
                        ? "border-transparent text-white"
                        : "border-border text-foreground hover:bg-accent"
                    }`}
                    style={
                      selectedTags.includes(tag.id)
                        ? { backgroundColor: tag.color }
                        : undefined
                    }
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_verified"
              className="rounded border-input"
              {...register("is_verified")}
            />
            <Label htmlFor="is_verified" className="font-normal">
              Mark as verified
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Line Items</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ name: "", quantity: 1, unit_price: 0, total_price: 0 })}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No line items added. Click &quot;Add Item&quot; to add receipt line items.
            </p>
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2">
                  <div className="flex-1">
                    <Input placeholder="Item name" {...register(`items.${index}.name`)} />
                  </div>
                  <div className="w-20">
                    <Input type="number" step="1" placeholder="Qty" {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
                  </div>
                  <div className="w-24">
                    <Input type="number" step="0.01" placeholder="Price" {...register(`items.${index}.unit_price`, { valueAsNumber: true })} />
                  </div>
                  <div className="w-24">
                    <Input type="number" step="0.01" placeholder="Total" {...register(`items.${index}.total_price`, { valueAsNumber: true })} />
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
          {loading && <Loader2 className="animate-spin" />}
          {isEditing ? "Update Expense" : "Create Expense"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
