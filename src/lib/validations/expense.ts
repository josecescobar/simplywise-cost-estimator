import { z } from "zod";

export const expenseItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  quantity: z.number().min(0, "Quantity must be positive"),
  unit_price: z.number().min(0, "Unit price must be positive"),
  total_price: z.number().min(0, "Total price must be positive"),
});

export const expenseSchema = z.object({
  vendor: z.string().min(1, "Vendor name is required"),
  description: z.string().optional(),
  amount: z.number().positive("Amount must be greater than 0"),
  subtotal: z.number().min(0).optional().nullable(),
  tax: z.number().min(0).optional().nullable(),
  tip: z.number().min(0).optional().nullable(),
  date: z.string().min(1, "Date is required"),
  category_id: z.string().uuid("Invalid category").optional().nullable(),
  receipt_id: z.string().uuid().optional().nullable(),
  is_verified: z.boolean().default(false),
  tag_ids: z.array(z.string().uuid()).optional().default([]),
  items: z.array(expenseItemSchema).optional().default([]),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;
export type ExpenseItemFormValues = z.infer<typeof expenseItemSchema>;
