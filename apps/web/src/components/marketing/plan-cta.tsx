"use client";

import Link from "next/link";

import { useAuth } from "@/features/auth/use-auth";
import { getPlanIntentHref, type PlanSlug } from "@/lib/plans";

export function PlanCta({
  plan,
  recommended = false,
}: {
  plan: PlanSlug;
  recommended?: boolean;
}) {
  const { isAuthenticated, isInitializing } = useAuth();
  const href = getPlanIntentHref(plan, !isInitializing && isAuthenticated);

  return (
    <Link
      href={href}
      className={`mt-7 inline-flex h-11 w-full items-center justify-center rounded-md px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        recommended
          ? "bg-emerald-950 text-white hover:bg-emerald-900 focus-visible:ring-emerald-700"
          : "border border-stone-300 bg-white text-stone-900 hover:border-emerald-800 hover:text-emerald-900 focus-visible:ring-emerald-700"
      }`}
    >
      <span className="capitalize">Choose {plan}</span>
    </Link>
  );
}
