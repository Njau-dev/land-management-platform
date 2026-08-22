"use client";

import { useCallback, useEffect, useState } from "react";

import { getPlansRequest } from "./subscription.api";
import { getSubscriptionErrorMessage } from "./subscription-errors";
import type {
  LoadStatus,
  SubscriptionPlan,
} from "./subscription.types";

export function usePlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      setPlans(await getPlansRequest());
      setStatus("ready");
    } catch (loadError) {
      setStatus("error");
      setError(
        getSubscriptionErrorMessage(
          loadError,
          "Plans are temporarily unavailable.",
        ),
      );
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    void getPlansRequest()
      .then((loadedPlans) => {
        if (isCancelled) return;
        setPlans(loadedPlans);
        setStatus("ready");
      })
      .catch((loadError: unknown) => {
        if (isCancelled) return;
        setStatus("error");
        setError(
          getSubscriptionErrorMessage(
            loadError,
            "Plans are temporarily unavailable.",
          ),
        );
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  return { plans, status, error, retry: loadPlans };
}
