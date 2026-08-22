import { apiRequest } from "@/lib/api-client";

import type {
  ActiveSubscription,
  Payment,
  SubscriptionPlan,
} from "./subscription.types";

export async function getPlansRequest(): Promise<SubscriptionPlan[]> {
  const response = await apiRequest<{ plans: SubscriptionPlan[] }>("/plans", {
    method: "GET",
    useAccessToken: false,
    retryAfterRefresh: false,
  });
  return response.plans;
}

export async function getSubscriptionRequest(): Promise<ActiveSubscription | null> {
  const response = await apiRequest<{
    activeSubscription: ActiveSubscription | null;
  }>("/subscription", { method: "GET" });
  return response.activeSubscription;
}

export async function initiateMpesaPaymentRequest(input: {
  planId: string;
  phoneNumber: string;
}): Promise<Payment> {
  const response = await apiRequest<{ payment: Payment }>(
    "/payments/mpesa/initiate",
    { method: "POST", body: input },
  );
  return response.payment;
}

export async function getPaymentStatusRequest(
  paymentId: string,
  signal?: AbortSignal,
): Promise<Payment> {
  const response = await apiRequest<{ payment: Payment }>(
    `/payments/${encodeURIComponent(paymentId)}/status`,
    { method: "GET", signal },
  );
  return response.payment;
}

export async function getPaymentHistoryRequest(): Promise<Payment[]> {
  const response = await apiRequest<{ payments: Payment[] }>("/payments", {
    method: "GET",
  });
  return response.payments;
}
