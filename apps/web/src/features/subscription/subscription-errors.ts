import { ApiError } from "@/lib/api-client";

export function getSubscriptionErrorMessage(
  error: unknown,
  fallback = "We could not load your subscription information.",
): string {
  if (!(error instanceof ApiError)) {
    return fallback;
  }

  const messages: Record<string, string> = {
    INVALID_PLAN: "This plan is no longer available. Please choose another plan.",
    INACTIVE_PLAN: "This plan is currently unavailable. Please choose another plan.",
    INVALID_PHONE_NUMBER: "Enter a valid Kenyan mobile number.",
    MPESA_AUTH_FAILED:
      "M-Pesa is temporarily unavailable. Please try again shortly.",
    MPESA_STK_INITIATION_FAILED:
      "We could not send the M-Pesa prompt. Check the number and try again.",
    PAYMENT_NOT_FOUND: "We could not find that payment for your account.",
    NETWORK_ERROR: "Unable to reach the server. Please check your connection.",
  };

  return messages[error.code] ?? error.message ?? fallback;
}
