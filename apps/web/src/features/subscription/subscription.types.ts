export type SubscriptionInterval = "WEEK" | "MONTH" | "YEAR";
export type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELLED";
export type PaymentStatus =
  | "INITIATED"
  | "PENDING"
  | "SUCCESSFUL"
  | "FAILED"
  | "CANCELLED";

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceKes: number;
  interval: SubscriptionInterval;
  intervalCount: number;
}

export interface ActiveSubscription {
  id: string;
  planId: string;
  startsAt: string;
  endsAt: string;
  status: SubscriptionStatus;
  accessEndsAt: string;
  remainingSeconds: number;
  plan: SubscriptionPlan;
}

export interface PaymentSubscription {
  id: string;
  startsAt: string;
  endsAt: string;
  status: SubscriptionStatus;
}

export interface Payment {
  id: string;
  provider: "MPESA";
  amountKes: number;
  phoneNumber: string;
  status: PaymentStatus;
  resultCode: number | null;
  resultDescription: string | null;
  mpesaReceiptNumber: string | null;
  createdAt: string;
  completedAt: string | null;
  plan: SubscriptionPlan;
  subscription: PaymentSubscription | null;
}

export type LoadStatus = "idle" | "loading" | "ready" | "error";

export interface SubscriptionContextValue {
  plans: SubscriptionPlan[];
  plansStatus: LoadStatus;
  plansError: string | null;
  activeSubscription: ActiveSubscription | null;
  subscriptionStatus: LoadStatus;
  subscriptionError: string | null;
  payments: Payment[];
  paymentsStatus: LoadStatus;
  paymentsError: string | null;
  refreshPlans: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  refreshPayments: () => Promise<void>;
  refreshAccountData: () => Promise<void>;
}
