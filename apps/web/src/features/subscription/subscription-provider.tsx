"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getPaymentHistoryRequest,
  getPlansRequest,
  getSubscriptionRequest,
} from "./subscription.api";
import { SubscriptionContext } from "./subscription-context";
import { getSubscriptionErrorMessage } from "./subscription-errors";
import type {
  ActiveSubscription,
  LoadStatus,
  Payment,
  SubscriptionContextValue,
  SubscriptionPlan,
} from "./subscription.types";

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansStatus, setPlansStatus] = useState<LoadStatus>("loading");
  const [plansError, setPlansError] = useState<string | null>(null);
  const [activeSubscription, setActiveSubscription] =
    useState<ActiveSubscription | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<LoadStatus>("loading");
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsStatus, setPaymentsStatus] = useState<LoadStatus>("loading");
  const [paymentsError, setPaymentsError] = useState<string | null>(null);

  const refreshPlans = useCallback(async () => {
    setPlansStatus("loading");
    setPlansError(null);
    try {
      setPlans(await getPlansRequest());
      setPlansStatus("ready");
    } catch (error) {
      setPlansStatus("error");
      setPlansError(
        getSubscriptionErrorMessage(error, "Plans are temporarily unavailable."),
      );
    }
  }, []);

  const refreshSubscription = useCallback(async () => {
    setSubscriptionStatus("loading");
    setSubscriptionError(null);
    try {
      setActiveSubscription(await getSubscriptionRequest());
      setSubscriptionStatus("ready");
    } catch (error) {
      setSubscriptionStatus("error");
      setSubscriptionError(getSubscriptionErrorMessage(error));
    }
  }, []);

  const refreshPayments = useCallback(async () => {
    setPaymentsStatus("loading");
    setPaymentsError(null);
    try {
      setPayments(await getPaymentHistoryRequest());
      setPaymentsStatus("ready");
    } catch (error) {
      setPaymentsStatus("error");
      setPaymentsError(
        getSubscriptionErrorMessage(error, "Payment history is unavailable."),
      );
    }
  }, []);

  const refreshAccountData = useCallback(async () => {
    await Promise.all([refreshSubscription(), refreshPayments()]);
  }, [refreshPayments, refreshSubscription]);

  useEffect(() => {
    let isCancelled = false;

    void getPlansRequest()
      .then((loadedPlans) => {
        if (isCancelled) return;
        setPlans(loadedPlans);
        setPlansStatus("ready");
      })
      .catch((error: unknown) => {
        if (isCancelled) return;
        setPlansStatus("error");
        setPlansError(
          getSubscriptionErrorMessage(
            error,
            "Plans are temporarily unavailable.",
          ),
        );
      });

    void getSubscriptionRequest()
      .then((subscription) => {
        if (isCancelled) return;
        setActiveSubscription(subscription);
        setSubscriptionStatus("ready");
      })
      .catch((error: unknown) => {
        if (isCancelled) return;
        setSubscriptionStatus("error");
        setSubscriptionError(getSubscriptionErrorMessage(error));
      });

    void getPaymentHistoryRequest()
      .then((history) => {
        if (isCancelled) return;
        setPayments(history);
        setPaymentsStatus("ready");
      })
      .catch((error: unknown) => {
        if (isCancelled) return;
        setPaymentsStatus("error");
        setPaymentsError(
          getSubscriptionErrorMessage(error, "Payment history is unavailable."),
        );
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      plans,
      plansStatus,
      plansError,
      activeSubscription,
      subscriptionStatus,
      subscriptionError,
      payments,
      paymentsStatus,
      paymentsError,
      refreshPlans,
      refreshSubscription,
      refreshPayments,
      refreshAccountData,
    }),
    [
      activeSubscription,
      payments,
      paymentsError,
      paymentsStatus,
      plans,
      plansError,
      plansStatus,
      refreshAccountData,
      refreshPayments,
      refreshPlans,
      refreshSubscription,
      subscriptionError,
      subscriptionStatus,
    ],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}
