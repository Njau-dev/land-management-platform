import { ApiError } from "@/lib/api-client";

export function isAdminForbidden(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.code === "FORBIDDEN" || error.code === "ACCOUNT_SUSPENDED")
  );
}

export function getAdminErrorMessage(
  error: unknown,
  fallback = "The administrator request could not be completed.",
): string {
  if (!(error instanceof ApiError)) return fallback;
  const messages: Record<string, string> = {
    DUPLICATE_TITLE_DEED_NUMBER: "That title deed number already exists.",
    TITLE_DEED_HAS_DEPENDENCIES:
      "Remove the related zoning, loan/lien, and ownership records before deleting this title deed.",
    DUPLICATE_ZONING: "The selected title deed already has a zoning record.",
    INVALID_RECORD: "The selected related record is no longer available.",
    USER_NOT_FOUND: "That user could not be found.",
    TITLE_DEED_NOT_FOUND: "That title deed could not be found.",
    ZONING_NOT_FOUND: "That zoning record could not be found.",
    LOAN_LIEN_NOT_FOUND: "That loan or lien record could not be found.",
    OWNERSHIP_HISTORY_NOT_FOUND: "That ownership record could not be found.",
    FORBIDDEN_ADMIN_ACTION: "This administrator action is not permitted.",
    FORBIDDEN: "Your account no longer has administrator permissions.",
    ACCOUNT_SUSPENDED: "This administrator account is suspended.",
    VALIDATION_ERROR: "Review the form values and try again.",
    NETWORK_ERROR: "Unable to reach the server. Check your connection.",
  };
  return messages[error.code] ?? error.message ?? fallback;
}
