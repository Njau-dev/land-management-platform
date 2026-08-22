import "dotenv/config";

import { z } from "zod";

const durationMultipliers = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 24 * 60 * 60,
} as const;

const durationSchema = z
  .string()
  .trim()
  .regex(/^\d+[smhd]$/, "Must be a duration such as 15m or 7d")
  .transform((value) => {
    const unit = value.at(-1) as keyof typeof durationMultipliers;
    return Number.parseInt(value.slice(0, -1), 10) * durationMultipliers[unit];
  })
  .pipe(z.number().int().positive());

const booleanStringSchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

const environmentSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]),
    PORT: z.coerce.number().int().min(1).max(65_535),
    FRONTEND_URL: z.string().trim().url(),
    DATABASE_URL: z.string().trim().min(1),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRES_IN: durationSchema,
    JWT_REFRESH_EXPIRES_IN: durationSchema,
    MPESA_ENVIRONMENT: z.enum(["sandbox", "production"]),
    MPESA_CONSUMER_KEY: z.string().trim().min(1),
    MPESA_CONSUMER_SECRET: z.string().trim().min(1),
    MPESA_SHORTCODE: z.string().trim().regex(/^\d+$/),
    MPESA_PASSKEY: z.string().trim().min(1),
    MPESA_CALLBACK_URL: z.string().trim().url(),
    MPESA_SIMULATE_CALLBACK: booleanStringSchema,
  })
  .superRefine((environment, context) => {
    if (environment.JWT_ACCESS_SECRET === environment.JWT_REFRESH_SECRET) {
      context.addIssue({
        code: "custom",
        path: ["JWT_REFRESH_SECRET"],
        message: "Must differ from JWT_ACCESS_SECRET",
      });
    }

    if (
      environment.MPESA_ENVIRONMENT === "production" &&
      environment.MPESA_SIMULATE_CALLBACK
    ) {
      context.addIssue({
        code: "custom",
        path: ["MPESA_SIMULATE_CALLBACK"],
        message: "Must be false when MPESA_ENVIRONMENT is production",
      });
    }
  });

const result = environmentSchema.safeParse(process.env);

if (!result.success) {
  const issues = result.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid environment configuration: ${issues}`);
}

export const env = result.data;
