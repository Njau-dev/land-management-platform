"use client";

import type { SubscriptionPlan } from "@/features/subscription/subscription.types";
import {
  formatKes,
  formatPlanDuration,
  getPlanSlug,
  planOrder,
} from "@/lib/plans";

export function PlanPicker({
  plans,
  onSelect,
  activePlanId,
}: {
  plans: SubscriptionPlan[];
  onSelect: (plan: SubscriptionPlan) => void;
  activePlanId?: string;
}) {
  const sortedPlans = [...plans].sort(
    (a, b) => planOrder(a.name) - planOrder(b.name),
  );

  return (
    <section aria-labelledby="plan-picker-title">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Access plans</p>
          <h2 id="plan-picker-title" className="mt-2 text-2xl font-bold tracking-[-0.03em] text-stone-950">
            Choose how long you need access
          </h2>
        </div>
        <p className="text-xs text-stone-500">All plans include the same features.</p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {sortedPlans.map((plan) => {
          const recommended = getPlanSlug(plan.name) === "monthly";
          return (
            <article
              key={plan.id}
              className={`flex flex-col border bg-white p-5 ${
                recommended ? "border-emerald-800" : "border-stone-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold text-stone-950">{plan.name}</h3>
                {activePlanId === plan.id ? (
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-800">Current</span>
                ) : recommended ? (
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-amber-800">Popular</span>
                ) : null}
              </div>
              <p className="mt-5 text-2xl font-bold tracking-tight text-stone-950">{formatKes(plan.priceKes)}</p>
              <p className="mt-1 text-xs text-stone-500">{formatPlanDuration(plan)}</p>
              <button
                type="button"
                onClick={() => onSelect(plan)}
                className={`mt-6 h-11 rounded-md px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 ${
                  recommended
                    ? "bg-emerald-950 text-white hover:bg-emerald-900"
                    : "border border-stone-300 text-stone-900 hover:border-emerald-800"
                }`}
              >
                {activePlanId ? "Extend with this plan" : "Choose plan"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
