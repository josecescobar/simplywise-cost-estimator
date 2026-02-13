import { z } from "zod";

export const tagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(30),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
});

export type TagFormValues = z.infer<typeof tagSchema>;
