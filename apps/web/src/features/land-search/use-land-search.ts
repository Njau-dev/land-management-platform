"use client";

import { useCallback, useState } from "react";

import { searchLandRequest } from "./land-search.api";
import {
  getLandSearchErrorMessage,
  isSubscriptionRequired,
} from "./land-search.errors";
import type {
  LandSearchResult,
  LandSearchStatus,
} from "./land-search.types";

export function useLandSearch(onSubscriptionRequired: () => Promise<void>) {
  const [result, setResult] = useState<LandSearchResult | null>(null);
  const [status, setStatus] = useState<LandSearchStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(
    async (titleDeedNumber: string) => {
      if (status === "loading") return;

      setStatus("loading");
      setError(null);
      try {
        const nextResult = await searchLandRequest(titleDeedNumber);
        setResult(nextResult);
        setStatus("success");
      } catch (searchError) {
        setResult(null);
        setStatus("error");
        setError(getLandSearchErrorMessage(searchError));
        if (isSubscriptionRequired(searchError)) {
          await onSubscriptionRequired();
        }
      }
    },
    [onSubscriptionRequired, status],
  );

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
    setStatus("idle");
  }, []);

  return { result, status, error, search, clear };
}
