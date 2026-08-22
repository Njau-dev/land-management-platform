"use client";

import { createContext } from "react";

import type { SubscriptionContextValue } from "./subscription.types";

export const SubscriptionContext =
  createContext<SubscriptionContextValue | null>(null);
