"use client";

import Link from "next/link";

import { useAuth } from "@/features/auth/use-auth";

export function HeroActions() {
  const { isAuthenticated, isInitializing } = useAuth();
  const href = !isInitializing && isAuthenticated ? "/dashboard" : "/signup";

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <Link
        href={href}
        className="inline-flex h-12 items-center justify-center rounded-md bg-emerald-950 px-6 text-sm font-semibold text-white transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
      >
        {!isInitializing && isAuthenticated ? "Open dashboard" : "Create your account"}
        <span aria-hidden="true" className="ml-2">→</span>
      </Link>
      <Link
        href="#how-it-works"
        className="inline-flex h-12 items-center justify-center rounded-md border border-stone-300 bg-white px-6 text-sm font-semibold text-stone-800 transition hover:border-stone-400 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
      >
        See how it works
      </Link>
    </div>
  );
}
