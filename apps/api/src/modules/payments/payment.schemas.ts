import { z } from "zod";

export const initiatePaymentSchema = z
  .object({
    planId: z.string().trim().min(1).max(30),
    phoneNumber: z.string().trim().min(9).max(30),
  })
  .strict();

const callbackItemSchema = z.object({
  Name: z.string(),
  Value: z.unknown().optional(),
});

export const mpesaCallbackSchema = z
  .object({
    Body: z.object({
      stkCallback: z.object({
        MerchantRequestID: z.string().min(1).max(100),
        CheckoutRequestID: z.string().min(1).max(100),
        ResultCode: z.coerce.number().int(),
        ResultDesc: z.string().max(500),
        CallbackMetadata: z
          .object({ Item: z.array(callbackItemSchema) })
          .optional(),
      }),
    }),
  })
  .passthrough();

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;
export type MpesaCallbackBody = z.infer<typeof mpesaCallbackSchema>;
