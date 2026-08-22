import { AppError } from "../../utils/app-error.js";

export function normalizeKenyanPhoneNumber(input: string): string {
  const compact = input.trim().replace(/[\s-]/g, "");
  let localNumber = compact;

  if (compact.startsWith("+254")) {
    localNumber = compact.slice(4);
  } else if (compact.startsWith("254")) {
    localNumber = compact.slice(3);
  } else if (compact.startsWith("0")) {
    localNumber = compact.slice(1);
  }

  if (!/^[17]\d{8}$/.test(localNumber)) {
    throw new AppError(
      400,
      "INVALID_PHONE_NUMBER",
      "Enter a valid Kenyan mobile number",
    );
  }

  return `254${localNumber}`;
}
