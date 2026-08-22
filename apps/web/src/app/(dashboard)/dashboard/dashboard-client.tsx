"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { AuthGuard } from "@/components/auth/auth-guard";
import { LandSearchPanel } from "@/components/land-search/land-search-panel";
import { Brand } from "@/components/marketing/brand";
import { PaymentCheckout } from "@/components/subscription/payment-checkout";
import { PaymentHistory } from "@/components/subscription/payment-history";
import { PlanPicker } from "@/components/subscription/plan-picker";
import { SubscriptionSummary } from "@/components/subscription/subscription-summary";
import { useAuth } from "@/features/auth/use-auth";
import { SubscriptionProvider } from "@/features/subscription/subscription-provider";
import type { SubscriptionPlan } from "@/features/subscription/subscription.types";
import { useSubscription } from "@/features/subscription/use-subscription";
import { getPlanSlug, type PlanIntent } from "@/lib/plans";

export function DashboardClient({
  selectedPlan,
}: {
  selectedPlan: PlanIntent | null;
}) {
  return (
    <AuthGuard>
      <SubscriptionProvider>
        <DashboardContent selectedPlanIntent={selectedPlan} />
      </SubscriptionProvider>
    </AuthGuard>
  );
}

function DashboardContent({
  selectedPlanIntent,
}: {
  selectedPlanIntent: PlanIntent | null;
}) {
  const router = useRouter();
  const { logout, user } = useAuth();
  const {
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
  } = useSubscription();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [planSelection, setPlanSelection] = useState<
    | { kind: "intent"; slug: PlanIntent["slug"] }
    | { kind: "plan"; plan: SubscriptionPlan }
    | null
  >(
    selectedPlanIntent
      ? { kind: "intent", slug: selectedPlanIntent.slug }
      : null,
  );
  const checkoutRef = useRef<HTMLDivElement>(null);
  const plansRef = useRef<HTMLDivElement>(null);
  const handledIntent = useRef(false);

  const focusCheckout = useCallback(() => {
    window.requestAnimationFrame(() => {
      checkoutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const choosePlan = useCallback(
    (plan: SubscriptionPlan) => {
      setPlanSelection({ kind: "plan", plan });
      focusCheckout();
    },
    [focusCheckout],
  );

  useEffect(() => {
    if (
      handledIntent.current ||
      !selectedPlanIntent ||
      plansStatus !== "ready"
    ) {
      return;
    }

    handledIntent.current = true;
    focusCheckout();
    router.replace("/dashboard", { scroll: false });
  }, [focusCheckout, plansStatus, router, selectedPlanIntent]);

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await logout();
  }

  function showPlans() {
    plansRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const paymentSucceeded = useCallback(async () => {
    await refreshAccountData();
  }, [refreshAccountData]);

  const checkoutPlan =
    planSelection?.kind === "plan"
      ? planSelection.plan
      : planSelection?.kind === "intent"
        ? plans.find((plan) => getPlanSlug(plan.name) === planSelection.slug) ?? null
        : null;

  return (
    <main className="min-h-screen bg-[#f6f5f0] text-stone-950">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
          <div className="flex items-center gap-8">
            <Brand />
            <nav aria-label="Dashboard" className="hidden items-center gap-1 md:flex">
              <a href="#overview" className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">Overview</a>
              <a href="#search" className="px-3 py-2 text-sm text-stone-600 hover:text-stone-950">Search</a>
              <a href="#subscription" className="px-3 py-2 text-sm text-stone-600 hover:text-stone-950">Subscription</a>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/" className="hidden rounded-md px-3 py-2 text-sm font-semibold text-stone-600 transition hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:block">
              Public site
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      </header>

      <div id="overview" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-8 sm:px-8 sm:py-12 lg:px-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Dashboard overview</p>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Welcome, {user?.name}</h1>
            <p className="mt-3 text-sm text-stone-600">{user?.email}</p>
          </div>
          <span className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">Authenticated account</span>
        </div>

        <section className="mt-8 border-l-4 border-emerald-700 bg-emerald-950 px-6 py-7 text-white shadow-sm sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Access model</p>
          <h2 className="mt-3 max-w-3xl text-2xl font-bold tracking-[-0.025em]">
            Authentication unlocks the dashboard. Subscription unlocks operations.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-100/70">
            Your account workspace is always available. A server-confirmed active plan prepares title search and reporting access.
          </p>
        </section>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.45fr_0.75fr]">
          <LandSearchPanel onChoosePlan={showPlans} />

          <div id="subscription" className="scroll-mt-24">
            <SubscriptionSummary
              subscription={activeSubscription}
              status={subscriptionStatus}
              error={subscriptionError}
              onRetry={refreshSubscription}
              onChoosePlan={showPlans}
            />
          </div>
        </div>

        {checkoutPlan ? (
          <div ref={checkoutRef} className="mt-8 scroll-mt-24">
            <PaymentCheckout
              key={checkoutPlan.id}
              plan={checkoutPlan}
              onSuccess={paymentSucceeded}
              onClose={() => setPlanSelection(null)}
            />
          </div>
        ) : null}

        <div ref={plansRef} className="mt-10 scroll-mt-24">
          {plansStatus === "loading" ? (
            <div className="grid gap-4 md:grid-cols-3" role="status" aria-label="Loading access plans">
              {[0, 1, 2].map((item) => <div key={item} className="h-56 animate-pulse border border-stone-200 bg-white" />)}
            </div>
          ) : null}
          {plansStatus === "error" ? (
            <div className="border border-amber-200 bg-amber-50 p-6" role="alert">
              <p className="text-sm font-bold text-amber-950">Plans could not be loaded</p>
              <p className="mt-2 text-sm text-amber-900/70">{plansError}</p>
              <button type="button" onClick={() => void refreshPlans()} className="mt-4 text-sm font-bold text-emerald-900 underline underline-offset-4">Retry</button>
            </div>
          ) : null}
          {plansStatus === "ready" && plans.length > 0 ? (
            <PlanPicker
              plans={plans}
              onSelect={choosePlan}
              activePlanId={activeSubscription?.plan.id}
            />
          ) : null}
          {plansStatus === "ready" && plans.length === 0 ? (
            <p className="border border-stone-200 bg-white p-6 text-sm text-stone-600">No active access plans are available right now.</p>
          ) : null}
        </div>

        <div className="mt-10">
          <PaymentHistory
            payments={payments}
            status={paymentsStatus}
            error={paymentsError}
            onRetry={refreshPayments}
          />
        </div>
      </div>
    </main>
  );
}
