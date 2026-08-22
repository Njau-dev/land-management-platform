import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .max(255)
  .email()
  .transform((email) => email.toLowerCase());

const bcryptCompatiblePassword = z
  .string()
  .min(1)
  .refine((password) => Buffer.byteLength(password, "utf8") <= 72, {
    message: "Password must not exceed 72 UTF-8 bytes",
  });

export const signupSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: emailSchema,
    password: bcryptCompatiblePassword.min(12),
  })
  .strict();

export const loginSchema = z
  .object({
    email: emailSchema,
    password: bcryptCompatiblePassword,
  })
  .strict();

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
