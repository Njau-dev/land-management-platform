"use client";

import { useMemo } from "react";

import { usePlans } from "@/features/subscription/use-plans";
import {
  formatKes,
  formatPlanDuration,
  getPlanSlug,
  planOrder,
} from "@/lib/plans";

import { PlanCta } from "./plan-cta";
import { SectionHeading } from "./section-heading";

export function PricingSection() {
  const { plans, status, error, retry } = usePlans();
  const knownPlans = useMemo(
    () =>
      plans
        .filter((plan) => getPlanSlug(plan.name) !== null)
        .sort((a, b) => planOrder(a.name) - planOrder(b.name)),
    [plans],
  );
  const weekly = knownPlans.find((plan) => getPlanSlug(plan.name) === "weekly");
  const monthly = knownPlans.find((plan) => getPlanSlug(plan.name) === "monthly");
  const annual = knownPlans.find((plan) => getPlanSlug(plan.name) === "annual");

  function comparisonFor(planName: string): {
    comparison: string;
    savings?: string;
  } {
    const slug = getPlanSlug(planName);

    if (slug === "weekly" && weekly) {
      return {
        comparison: `${formatKes(weekly.priceKes)} × 4 weeks ≈ ${formatKes(
          weekly.priceKes * 4,
        )}/month`,
      };
    }

    if (slug === "monthly" && weekly && monthly) {
      const equivalent = weekly.priceKes * 4;
      const savings = equivalent - monthly.priceKes;
      return {
        comparison: `Four weekly purchases ≈ ${formatKes(equivalent)}/month`,
        ...(savings > 0
          ? { savings: `Save approximately ${formatKes(savings)}` }
          : {}),
      };
    }

    if (slug === "annual" && monthly && annual) {
      const equivalent = monthly.priceKes * 12;
      const savings = equivalent - annual.priceKes;
      return {
        comparison: `12 monthly purchases would cost ${formatKes(equivalent)}`,
        ...(savings > 0
          ? { savings: `Save ${formatKes(savings)} annually` }
          : {}),
      };
    }

    return { comparison: "All platform features included" };
  }

  return (
    <section
      id="pricing"
      className="scroll-mt-24 bg-stone-100 px-5 py-20 sm:px-8 sm:py-28 lg:px-10"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Simple pricing"
          title="The same access. Choose your duration."
          description="Every plan unlocks the same platform features. Choose the timeframe that fits the work ahead, then complete a secure M-Pesa checkout from your dashboard."
          centered
        />

        {status === "loading" ? (
          <div className="mt-12 grid gap-5 lg:grid-cols-3" aria-label="Loading plans">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-112 animate-pulse rounded-xl border border-stone-200 bg-white"
              />
            ))}
          </div>
        ) : null}

        {status === "error" ? (
          <div className="mx-auto mt-12 max-w-xl border border-amber-200 bg-amber-50 px-6 py-6 text-center" role="alert">
            <p className="text-sm font-bold text-amber-950">Plans could not be loaded</p>
            <p className="mt-2 text-sm text-amber-900/70">{error}</p>
            <button
              type="button"
              onClick={() => void retry()}
              className="mt-5 rounded-md bg-emerald-950 px-5 py-2.5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
            >
              Retry
            </button>
          </div>
        ) : null}

        {status === "ready" && knownPlans.length === 0 ? (
          <div className="mx-auto mt-12 max-w-xl border border-stone-200 bg-white px-6 py-6 text-center">
            <p className="text-sm font-bold text-stone-900">No access plans are currently available.</p>
            <p className="mt-2 text-sm text-stone-600">Please check again later.</p>
          </div>
        ) : null}

        {status === "ready" && knownPlans.length > 0 ? (
          <div className="mt-12 grid items-stretch gap-5 lg:grid-cols-3">
            {knownPlans.map((plan) => {
              const slug = getPlanSlug(plan.name);
              if (!slug) return null;
              const recommended = slug === "monthly";
              const presentation = comparisonFor(plan.name);

              return (
                <article
                  key={plan.id}
                  className={`relative flex flex-col rounded-xl border bg-white p-7 sm:p-8 ${
                    recommended
                      ? "border-emerald-900 shadow-[0_18px_45px_rgba(6,78,59,0.12)] lg:-translate-y-2"
                      : "border-stone-200"
                  }`}
                >
                  {recommended ? (
                    <span className="absolute right-5 top-5 rounded-full bg-emerald-100 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-emerald-900">
                      Recommended value
                    </span>
                  ) : null}
                  <h3 className="text-lg font-bold text-stone-950">{plan.name}</h3>
                  <p className="mt-6 text-4xl font-bold tracking-[-0.045em] text-stone-950">
                    {formatKes(plan.priceKes)}
                  </p>
                  <p className="mt-2 text-sm font-medium text-stone-500">
                    {formatPlanDuration(plan)}
                  </p>
                  <div className="mt-6 min-h-18 border-t border-stone-200 pt-5">
                    <p className="text-xs leading-5 text-stone-500">
                      {presentation.comparison}
                    </p>
                    {presentation.savings ? (
                      <p className="mt-1 text-sm font-bold text-emerald-800">
                        {presentation.savings}
                      </p>
                    ) : null}
                  </div>
                  <ul className="mt-6 flex-1 space-y-3 text-sm text-stone-700">
                    {[
                      "Title deed information lookup",
                      "Consolidated result view",
                      "Downloadable report access",
                    ].map((feature) => (
                      <li key={feature} className="flex gap-3">
                        <span aria-hidden="true" className="font-bold text-emerald-700">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <PlanCta plan={slug} recommended={recommended} />
                </article>
              );
            })}
          </div>
        ) : null}

        <p className="mt-6 text-center text-xs leading-5 text-stone-500">
          Prices and plan availability are loaded directly from the platform.
          Payments currently use the Daraja sandbox environment.
        </p>
      </div>
    </section>
  );
}
