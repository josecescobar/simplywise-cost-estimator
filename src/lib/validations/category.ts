import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  sort_order: z.coerce.number().int().min(0).optional(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
