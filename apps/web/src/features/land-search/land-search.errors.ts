import { ApiError } from "@/lib/api-client";

export function isSubscriptionRequired(error: unknown): boolean {
  return error instanceof ApiError && error.code === "SUBSCRIPTION_REQUIRED";
}

export function getLandSearchErrorMessage(
  error: unknown,
  fallback = "The request could not be completed. Please try again.",
): string {
  if (!(error instanceof ApiError)) return fallback;

  const messages: Record<string, string> = {
    TITLE_DEED_NOT_FOUND:
      "We couldn't find that title deed in the current demo dataset.",
    VALIDATION_ERROR: "Enter a valid title deed number.",
    SUBSCRIPTION_REQUIRED:
      "Your subscription is not currently active. Choose a plan to continue.",
    ACCOUNT_SUSPENDED: "Your account is suspended and cannot perform searches.",
    NETWORK_ERROR: "Unable to reach the server. Please check your connection.",
  };

  return messages[error.code] ?? error.message ?? fallback;
}
