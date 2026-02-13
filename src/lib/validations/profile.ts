import { z } from "zod";

export const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  currency: z.string().min(1, "Currency is required"),
  timezone: z.string().min(1, "Timezone is required"),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
