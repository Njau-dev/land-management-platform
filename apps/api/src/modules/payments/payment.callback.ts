import { AppError } from "../../utils/app-error.js";
import type { MpesaCallbackBody } from "./payment.schemas.js";
import type { MpesaConfirmationInput } from "./payment.types.js";

function callbackValue(
  items: Array<{ Name: string; Value?: unknown }>,
  name: string,
): unknown {
  return items.find((item) => item.Name === name)?.Value;
}

export function parseMpesaCallback(
  body: MpesaCallbackBody,
): MpesaConfirmationInput {
  const callback = body.Body.stkCallback;
  const input: MpesaConfirmationInput = {
    checkoutRequestId: callback.CheckoutRequestID,
    merchantRequestId: callback.MerchantRequestID,
    resultCode: callback.ResultCode,
    resultDescription: callback.ResultDesc,
    providerMetadata: { source: "daraja-callback" },
  };

  if (callback.ResultCode !== 0) {
    return input;
  }

  const items = callback.CallbackMetadata?.Item ?? [];
  const receipt = callbackValue(items, "MpesaReceiptNumber");
  const amount = callbackValue(items, "Amount");
  const phone = callbackValue(items, "PhoneNumber");
  const transactionDate = callbackValue(items, "TransactionDate");

  if (
    typeof receipt !== "string" ||
    (typeof amount !== "number" && typeof amount !== "string") ||
    (typeof phone !== "number" && typeof phone !== "string")
  ) {
    throw new AppError(
      400,
      "INVALID_MPESA_CALLBACK",
      "Invalid M-Pesa callback metadata",
    );
  }

  const amountKes = Number(amount);
  if (!Number.isFinite(amountKes)) {
    throw new AppError(
      400,
      "INVALID_MPESA_CALLBACK",
      "Invalid M-Pesa callback metadata",
    );
  }

  return {
    ...input,
    mpesaReceiptNumber: receipt,
    amountKes,
    phoneNumber: String(phone),
    providerMetadata: {
      source: "daraja-callback",
      ...(transactionDate !== undefined ? { transactionDate } : {}),
    },
  };
}
