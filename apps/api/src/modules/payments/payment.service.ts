import {
  PaymentProvider,
  PaymentStatus,
  Prisma,
} from "../../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/app-error.js";
import {
  initiateMpesaStkPush,
  MpesaProviderError,
} from "./mpesa.client.js";
import { safePaymentSelect } from "./payment.dto.js";
import type { InitiatePaymentInput } from "./payment.schemas.js";
import {
  isMpesaSimulatorEnabled,
  simulateSuccessfulMpesaCallback,
} from "./payment.simulator.js";
import { normalizeKenyanPhoneNumber } from "./phone-number.js";

function providerMetadata(
  value: Record<string, unknown>,
): Prisma.InputJsonObject {
  return value as Prisma.InputJsonObject;
}

export async function initiatePayment(
  userId: string,
  input: InitiatePaymentInput,
) {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: input.planId },
  });

  if (!plan) {
    throw new AppError(404, "INVALID_PLAN", "Subscription plan not found");
  }

  if (!plan.isActive) {
    throw new AppError(
      409,
      "INACTIVE_PLAN",
      "Subscription plan is not available",
    );
  }

  const phoneNumber = normalizeKenyanPhoneNumber(input.phoneNumber);
  const payment = await prisma.payment.create({
    data: {
      userId,
      planId: plan.id,
      provider: PaymentProvider.MPESA,
      amountKes: plan.priceKes,
      phoneNumber,
      status: PaymentStatus.INITIATED,
    },
  });

  try {
    const stkResult = await initiateMpesaStkPush({
      amountKes: plan.priceKes,
      phoneNumber,
      accountReference: `ARDHI${payment.id.slice(-7)}`,
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        merchantRequestId: stkResult.merchantRequestId,
        checkoutRequestId: stkResult.checkoutRequestId,
        status: PaymentStatus.PENDING,
        providerMetadata: providerMetadata({
          initiation: {
            responseCode: stkResult.responseCode,
            responseDescription: stkResult.responseDescription ?? null,
            customerMessage: stkResult.customerMessage ?? null,
          },
        }),
      },
    });

    if (isMpesaSimulatorEnabled()) {
      await simulateSuccessfulMpesaCallback(payment.id);
    }
  } catch (error) {
    if (error instanceof MpesaProviderError) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          resultDescription: error.message,
          completedAt: new Date(),
          providerMetadata: providerMetadata({
            initiationFailure: error.safeProviderMetadata,
          }),
        },
      });
    }

    throw error;
  }

  return prisma.payment.findUniqueOrThrow({
    where: { id: payment.id },
    select: safePaymentSelect,
  });
}

export async function getPaymentStatus(userId: string, paymentId: string) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, userId },
    select: safePaymentSelect,
  });

  if (!payment) {
    throw new AppError(404, "PAYMENT_NOT_FOUND", "Payment not found");
  }

  return payment;
}

export async function listPaymentHistory(userId: string) {
  return prisma.payment.findMany({
    where: { userId },
    select: safePaymentSelect,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
