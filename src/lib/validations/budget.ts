import { z } from "zod";

export const budgetSchema = z.object({
  category_id: z.string().uuid("Invalid category").optional().nullable(),
  amount: z.number().positive("Amount must be greater than 0"),
});

export type BudgetFormValues = z.infer<typeof budgetSchema>;
