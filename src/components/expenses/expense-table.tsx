"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Receipt, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Expense } from "@/lib/types";
import { toast } from "sonner";

interface ExpenseTableProps {
  expenses: Expense[];
  sortBy: string;
  sortOrder: string;
  onSort: (column: string) => void;
}

export function ExpenseTable({ expenses, sortBy, sortOrder, onSort }: ExpenseTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/expenses/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Expense deleted");
      router.refresh();
      window.location.reload();
    } catch {
      toast.error("Failed to delete expense");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    );
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">No expenses yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Get started by adding your first expense.
        </p>
        <Link href="/expenses/new">
          <Button className="mt-4">Add Expense</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => onSort("date")}>
                Date <SortIcon column="date" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => onSort("vendor")}>
                Vendor <SortIcon column="vendor" />
              </TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => onSort("amount")}>
                Amount <SortIcon column="amount" />
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{formatDate(expense.date)}</TableCell>
                <TableCell>
                  <div>
                    <span className="font-medium">{expense.vendor}</span>
                    {expense.description && (
                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {expense.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {expense.category ? (
                    <Badge
                      variant="secondary"
                      style={{ backgroundColor: expense.category.color + "20", color: expense.category.color }}
                    >
                      {expense.category.name}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(expense.amount)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link href={`/expenses/${expense.id}/edit`}>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(expense.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {expenses.map((expense) => (
          <div key={expense.id} className="border rounded-lg p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{expense.vendor}</p>
                <p className="text-sm text-muted-foreground">{formatDate(expense.date)}</p>
              </div>
              <p className="font-semibold">{formatCurrency(expense.amount)}</p>
            </div>
            {expense.category && (
              <Badge
                variant="secondary"
                style={{ backgroundColor: expense.category.color + "20", color: expense.category.color }}
              >
                {expense.category.name}
              </Badge>
            )}
            <div className="flex justify-end gap-1 pt-1">
              <Link href={`/expenses/${expense.id}/edit`}>
                <Button variant="ghost" size="sm">Edit</Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => setDeleteId(expense.id)} className="text-destructive">
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
