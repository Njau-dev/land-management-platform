import {
  PaymentStatus,
  Prisma,
} from "../../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/app-error.js";
import { activateSubscriptionForPayment } from "../subscriptions/subscription.service.js";
import { normalizeKenyanPhoneNumber } from "./phone-number.js";
import type { MpesaConfirmationInput } from "./payment.types.js";

const terminalStatuses = [
  PaymentStatus.SUCCESSFUL,
  PaymentStatus.FAILED,
  PaymentStatus.CANCELLED,
] as const;

function invalidConfirmation(): never {
  throw new AppError(
    400,
    "INVALID_MPESA_CONFIRMATION",
    "M-Pesa confirmation did not match the payment",
  );
}

function toJsonObject(value: unknown): Prisma.InputJsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Prisma.InputJsonObject;
  }

  return {};
}

function confirmationMetadata(
  existing: unknown,
  input: MpesaConfirmationInput,
): Prisma.InputJsonObject {
  return {
    ...toJsonObject(existing),
    confirmation: {
      source: input.providerMetadata?.["source"] ?? "daraja-callback",
      receivedAt: new Date().toISOString(),
      ...(input.providerMetadata ?? {}),
    } as Prisma.InputJsonObject,
  };
}

function validateSuccessfulConfirmation(
  payment: {
    amountKes: number;
    phoneNumber: string;
    merchantRequestId: string | null;
  },
  input: MpesaConfirmationInput,
): void {
  let normalizedPhone: string;

  try {
    normalizedPhone = normalizeKenyanPhoneNumber(input.phoneNumber ?? "");
  } catch {
    invalidConfirmation();
  }

  if (
    !input.mpesaReceiptNumber ||
    input.amountKes !== payment.amountKes ||
    normalizedPhone !== payment.phoneNumber ||
    (input.merchantRequestId &&
      payment.merchantRequestId &&
      input.merchantRequestId !== payment.merchantRequestId)
  ) {
    invalidConfirmation();
  }
}

export async function completeMpesaPayment(input: MpesaConfirmationInput) {
  return prisma.$transaction(async (transaction) => {
    const payment = await transaction.payment.findUnique({
      where: { checkoutRequestId: input.checkoutRequestId },
      include: { plan: true, subscription: true },
    });

    if (!payment) {
      return null;
    }

    if (
      terminalStatuses.includes(
        payment.status as (typeof terminalStatuses)[number],
      )
    ) {
      return payment;
    }

    const isSuccessful = input.resultCode === 0;

    if (isSuccessful) {
      validateSuccessfulConfirmation(payment, input);
    }

    const completedAt = new Date();
    const claimed = await transaction.payment.updateMany({
      where: {
        id: payment.id,
        status: { in: [PaymentStatus.INITIATED, PaymentStatus.PENDING] },
        subscriptionId: null,
      },
      data: {
        status: isSuccessful ? PaymentStatus.SUCCESSFUL : PaymentStatus.FAILED,
        resultCode: input.resultCode,
        resultDescription: input.resultDescription.slice(0, 500),
        ...(input.mpesaReceiptNumber
          ? { mpesaReceiptNumber: input.mpesaReceiptNumber }
          : {}),
        providerMetadata: confirmationMetadata(payment.providerMetadata, input),
        completedAt,
      },
    });

    if (claimed.count !== 1) {
      return transaction.payment.findUniqueOrThrow({
        where: { id: payment.id },
        include: { plan: true, subscription: true },
      });
    }

    if (!isSuccessful) {
      return transaction.payment.findUniqueOrThrow({
        where: { id: payment.id },
        include: { plan: true, subscription: true },
      });
    }

    const subscription = await activateSubscriptionForPayment(
      transaction,
      payment,
      completedAt,
    );

    return transaction.payment.update({
      where: { id: payment.id },
      data: { subscriptionId: subscription.id },
      include: { plan: true, subscription: true },
    });
  });
}
