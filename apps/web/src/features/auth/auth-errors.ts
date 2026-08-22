import { ApiError } from "@/lib/api-client";

export function getAuthErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error instanceof ApiError) {
    if (error.code === "INVALID_CREDENTIALS") {
      return "The email or password you entered is incorrect.";
    }

    if (error.code === "ACCOUNT_SUSPENDED") {
      return "This account is suspended. Please contact support.";
    }

    return error.message;
  }

  return fallback;
}
