import { z } from "zod";

export const landSearchParamsSchema = z.object({
  titleDeedNumber: z
    .string()
    .trim()
    .min(1, "Title deed number is required")
    .max(100, "Title deed number is too long")
    .refine(
      (value) => !/[\u0000-\u001F\u007F]/u.test(value),
      "Title deed number contains invalid characters",
    ),
});

export type LandSearchParams = z.infer<typeof landSearchParamsSchema>;
