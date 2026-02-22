"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { BudgetStatus, Category } from "@/lib/types";
import { useCurrency } from "@/hooks/use-currency";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface BudgetManagerProps {
  budgets: BudgetStatus[];
  categories: Category[];
}

export function BudgetManager({ budgets: initialBudgets, categories }: BudgetManagerProps) {
  const [budgets, setBudgets] = useState(initialBudgets);
  const [showAdd, setShowAdd] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const currency = useCurrency();

  // Categories that don't already have a budget
  const availableCategories = categories.filter(
    (cat) => !budgets.some((b) => b.budget.category_id === cat.id)
  );
  const hasOverallBudget = budgets.some((b) => !b.budget.category_id);

  const handleAdd = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: categoryId || null,
          amount: parsedAmount,
        }),
      });
      if (!res.ok) throw new Error("Failed to create budget");

      // Refresh budget list to get computed statuses
      const statusRes = await fetch("/api/budgets");
      const statuses = await statusRes.json();
      setBudgets(statuses);

      setCategoryId("");
      setAmount("");
      setShowAdd(false);
      toast.success("Budget saved!");
    } catch {
      toast.error("Failed to save budget");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch("/api/budgets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteId }),
      });
      setBudgets(budgets.filter((b) => b.budget.id !== deleteId));
      toast.success("Budget deleted!");
    } catch {
      toast.error("Failed to delete budget");
    } finally {
      setDeleteId(null);
    }
  };

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Budgets</CardTitle>
            <CardDescription>Set monthly spending limits</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {budgets.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">
            No budgets set. Create your first spending limit!
          </p>
        ) : (
          <div className="space-y-4">
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
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">
                        {formatCurrency(bs.spent, currency)} / {formatCurrency(bs.budget.amount, currency)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setDeleteId(bs.budget.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
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
          </div>
        )}

        {/* Add Dialog */}
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Budget</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Scope</Label>
                <Select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {!hasOverallBudget && <option value="">Overall (all categories)</option>}
                  {availableCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Monthly Limit</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button
                onClick={handleAdd}
                disabled={loading || !amount || parseFloat(amount) <= 0}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Budget</DialogTitle>
              <DialogDescription>
                Are you sure? This will remove the spending limit.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
