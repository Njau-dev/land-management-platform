"use client";

import { useEffect, useState } from "react";

import {
  AdminError,
  AdminLoading,
  AdminPageHeader,
  formatAdminKes,
} from "@/components/admin/admin-ui";
import { getAdminAnalyticsRequest } from "@/features/admin/admin.api";
import {
  getAdminErrorMessage,
  isAdminForbidden,
} from "@/features/admin/admin.errors";
import type { AdminAnalytics } from "@/features/admin/admin.types";
import { useAuth } from "@/features/auth/use-auth";

const metrics: Array<{
  key: keyof AdminAnalytics;
  label: string;
  description: string;
  currency?: boolean;
}> = [
    { key: "totalUsers", label: "Total users", description: "Registered customer accounts" },
    { key: "activeSubscribers", label: "Active subscribers", description: "Current paid entitlements" },
    { key: "usersWithoutActiveSubscription", label: "No active plan", description: "Users without current access" },
    { key: "successfulPaymentRevenueKes", label: "Revenue", description: "Successful payments only", currency: true },
    { key: "successfulPayments", label: "Successful payments", description: "Confirmed transactions" },
    { key: "searchesToday", label: "Searches today", description: "Since midnight in Nairobi" },
    { key: "searchesThisMonth", label: "Searches this month", description: "Current Nairobi month" },
    { key: "totalTitleDeeds", label: "Title deeds", description: "Records in the dataset" },
  ];

export default function AdminOverviewPage() {
  const { refreshUser } = useAuth();
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void getAdminAnalyticsRequest()
      .then((data) => {
        if (cancelled) return;
        setAnalytics(data);
        setError(null);
      })
      .catch(async (loadError: unknown) => {
        if (cancelled) return;
        setError(getAdminErrorMessage(loadError));
        if (isAdminForbidden(loadError)) await refreshUser();
      });
    return () => {
      cancelled = true;
    };
  }, [refreshUser, reloadKey]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Platform overview"
        title="Administration"
        description="A concise, live view of accounts, paid access, search activity, and the seeded land dataset."
      />
      {!analytics && !error ? <AdminLoading label="Loading platform analytics" /> : null}
      {error ? <AdminError message={error} onRetry={() => { setAnalytics(null); setError(null); setReloadKey((key) => key + 1); }} /> : null}
      {analytics ? (
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Platform metrics">
          {metrics.map((metric) => (
            <article key={metric.key} className="border border-stone-200 bg-white p-5 shadow-[0_10px_30px_rgba(41,37,36,0.04)]">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-stone-500">{metric.label}</p>
              <p className="mt-3 text-3xl font-bold tracking-[-0.04em] text-emerald-950">
                {metric.currency ? formatAdminKes(analytics[metric.key]) : analytics[metric.key].toLocaleString("en-KE")}
              </p>
              <p className="mt-2 text-xs leading-5 text-stone-500">{metric.description}</p>
            </article>
          ))}
        </section>
      ) : null}
    </>
  );
}
