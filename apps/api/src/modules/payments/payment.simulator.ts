import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/app-error.js";
import { completeMpesaPayment } from "./payment.confirmation.js";

export function isMpesaSimulatorEnabled(): boolean {
  return (
    env.MPESA_ENVIRONMENT === "sandbox" && env.MPESA_SIMULATE_CALLBACK
  );
}

export async function simulateSuccessfulMpesaCallback(paymentId: string) {
  if (!isMpesaSimulatorEnabled()) {
    throw new AppError(
      403,
      "MPESA_SIMULATOR_DISABLED",
      "M-Pesa callback simulation is disabled",
    );
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      amountKes: true,
      phoneNumber: true,
      merchantRequestId: true,
      checkoutRequestId: true,
    },
  });

  if (!payment?.checkoutRequestId) {
    throw new AppError(404, "PAYMENT_NOT_FOUND", "Payment not found");
  }

  return completeMpesaPayment({
    checkoutRequestId: payment.checkoutRequestId,
    ...(payment.merchantRequestId
      ? { merchantRequestId: payment.merchantRequestId }
      : {}),
    resultCode: 0,
    resultDescription: "Sandbox callback simulation completed successfully",
    mpesaReceiptNumber: `SANDBOX-${payment.id.toUpperCase()}`,
    amountKes: payment.amountKes,
    phoneNumber: payment.phoneNumber,
    providerMetadata: { source: "sandbox-simulator", synthetic: true },
  });
}
