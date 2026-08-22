import { z } from "zod";

import {
  AvailabilityStatus,
  LoanLienStatus,
  LoanLienType,
  UserRole,
  UserStatus,
  ZoneType,
} from "../../../generated/prisma/client.js";
import { AppError, type ValidationIssue } from "../../utils/app-error.js";

const optionalSearch = z.string().trim().max(191).optional();
const paginationFields = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

const decimalString = (
  label: string,
  maximumIntegerDigits: number,
  maximumDecimalPlaces: number,
  positive: boolean,
) =>
  z
    .string()
    .trim()
    .regex(/^\d+(?:\.\d+)?$/, `${label} must be a decimal number`)
    .refine((value) => {
      const [integer = "", fraction = ""] = value.split(".");
      const significantInteger = integer.replace(/^0+(?=\d)/, "");
      return (
        significantInteger.length <= maximumIntegerDigits &&
        fraction.length <= maximumDecimalPlaces
      );
    }, `${label} exceeds the supported precision`)
    .refine(
      (value) => !positive || !/^0+(?:\.0+)?$/.test(value),
      `${label} must be greater than zero`,
    );

const nullableText = (maximum: number) =>
  z.string().trim().max(maximum).nullable().optional();

const dateValue = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date")
  .transform((value) => new Date(value));

export const idParamsSchema = z.object({
  id: z.string().trim().min(1).max(30),
});

export const userListQuerySchema = z.object({
  ...paginationFields,
  search: optionalSearch,
  role: z.enum(UserRole).optional(),
  status: z.enum(UserStatus).optional(),
});

export const updateUserSchema = z
  .object({ status: z.enum(UserStatus) })
  .strict();

export const titleDeedListQuerySchema = z.object({
  ...paginationFields,
  search: optionalSearch,
  availabilityStatus: z.enum(AvailabilityStatus).optional(),
});

export const createTitleDeedSchema = z
  .object({
    titleDeedNumber: z.string().trim().min(1).max(100),
    ownerName: z.string().trim().min(1).max(191),
    location: z.string().trim().min(1).max(255),
    size: decimalString("Parcel size", 10, 4, true),
    availabilityStatus: z.enum(AvailabilityStatus),
    landRate: decimalString("Land rate", 13, 2, false),
  })
  .strict();

export const updateTitleDeedSchema = createTitleDeedSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "No changes provided");

export const zoningListQuerySchema = z.object({
  ...paginationFields,
  search: optionalSearch,
  zoneType: z.enum(ZoneType).optional(),
  titleDeedId: z.string().trim().min(1).max(30).optional(),
});

export const createZoningSchema = z
  .object({
    titleDeedId: z.string().trim().min(1).max(30),
    zoneType: z.enum(ZoneType),
    notes: nullableText(10_000),
    restrictions: nullableText(10_000),
  })
  .strict();

export const updateZoningSchema = createZoningSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "No changes provided");

export const loanListQuerySchema = z.object({
  ...paginationFields,
  search: optionalSearch,
  type: z.enum(LoanLienType).optional(),
  status: z.enum(LoanLienStatus).optional(),
  titleDeedId: z.string().trim().min(1).max(30).optional(),
});

export const createLoanSchema = z
  .object({
    titleDeedId: z.string().trim().min(1).max(30),
    type: z.enum(LoanLienType),
    lender: z.string().trim().min(1).max(191),
    amount: decimalString("Amount", 13, 2, false),
    status: z.enum(LoanLienStatus),
    dueDate: dateValue.nullable().optional(),
    notes: nullableText(10_000),
  })
  .strict();

export const updateLoanSchema = createLoanSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "No changes provided");

export const ownershipListQuerySchema = z.object({
  ...paginationFields,
  search: optionalSearch,
  titleDeedId: z.string().trim().min(1).max(30).optional(),
});

export const createOwnershipSchema = z
  .object({
    titleDeedId: z.string().trim().min(1).max(30),
    ownerName: z.string().trim().min(1).max(191),
    transferDate: dateValue,
    notes: nullableText(10_000),
  })
  .strict();

export const updateOwnershipSchema = createOwnershipSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "No changes provided");

export function parseAdminInput<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (result.success) return result.data;

  const details: ValidationIssue[] = result.error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
  throw new AppError(400, "VALIDATION_ERROR", "Invalid request", details);
}

export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type TitleDeedListQuery = z.infer<typeof titleDeedListQuerySchema>;
export type CreateTitleDeedInput = z.infer<typeof createTitleDeedSchema>;
export type UpdateTitleDeedInput = z.infer<typeof updateTitleDeedSchema>;
export type ZoningListQuery = z.infer<typeof zoningListQuerySchema>;
export type CreateZoningInput = z.infer<typeof createZoningSchema>;
export type UpdateZoningInput = z.infer<typeof updateZoningSchema>;
export type LoanListQuery = z.infer<typeof loanListQuerySchema>;
export type CreateLoanInput = z.infer<typeof createLoanSchema>;
export type UpdateLoanInput = z.infer<typeof updateLoanSchema>;
export type OwnershipListQuery = z.infer<typeof ownershipListQuerySchema>;
export type CreateOwnershipInput = z.infer<typeof createOwnershipSchema>;
export type UpdateOwnershipInput = z.infer<typeof updateOwnershipSchema>;
