import type {
  ActiveSubscription,
  LoadStatus,
} from "@/features/subscription/subscription.types";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "long" }).format(
    new Date(value),
  );
}

function remainingCopy(seconds: number): string {
  const days = Math.ceil(seconds / 86_400);
  if (days > 1) return `${days} days of access remaining`;
  if (days === 1) return "About 1 day of access remaining";

  const hours = Math.max(1, Math.ceil(seconds / 3_600));
  return `About ${hours} ${hours === 1 ? "hour" : "hours"} remaining`;
}

export function SubscriptionSummary({
  subscription,
  status,
  error,
  onRetry,
  onChoosePlan,
}: {
  subscription: ActiveSubscription | null;
  status: LoadStatus;
  error: string | null;
  onRetry: () => Promise<void>;
  onChoosePlan: () => void;
}) {
  return (
    <aside className="border border-stone-200 bg-white p-6 shadow-[0_8px_25px_rgba(28,25,23,0.04)]" aria-labelledby="current-plan-title">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Current access</p>
      <h2 id="current-plan-title" className="mt-2 text-xl font-bold tracking-tight text-stone-950">Subscription</h2>

      {status === "loading" ? (
        <div className="mt-6 space-y-3" role="status">
          <span className="block h-5 w-28 animate-pulse bg-stone-200" />
          <span className="block h-4 w-full animate-pulse bg-stone-100" />
          <span className="sr-only">Loading subscription…</span>
        </div>
      ) : null}

      {status === "error" ? (
        <div className="mt-6" role="alert">
          <p className="text-sm leading-6 text-red-700">{error}</p>
          <button type="button" onClick={() => void onRetry()} className="mt-3 text-sm font-bold text-emerald-800 underline underline-offset-4">
            Retry
          </button>
        </div>
      ) : null}

      {status === "ready" && !subscription ? (
        <div className="mt-6">
          <span className="inline-flex rounded-full bg-stone-100 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-stone-700">No active plan</span>
          <p className="mt-4 text-sm leading-6 text-stone-600">
            Choose an access plan to start searching title deeds when search launches.
          </p>
          <button
            type="button"
            onClick={onChoosePlan}
            className="mt-5 h-11 w-full rounded-md bg-emerald-950 px-4 text-sm font-bold text-white hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
          >
            Choose a plan
          </button>
        </div>
      ) : null}

      {status === "ready" && subscription ? (
        <div className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-lg font-bold text-stone-950">{subscription.plan.name}</p>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-emerald-900">Active</span>
          </div>
          <dl className="mt-5 space-y-4 border-t border-stone-200 pt-5 text-sm">
            <div>
              <dt className="text-xs text-stone-500">Current period began</dt>
              <dd className="mt-1 font-semibold text-stone-900">{formatDate(subscription.startsAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500">Access paid through</dt>
              <dd className="mt-1 font-semibold text-stone-900">{formatDate(subscription.accessEndsAt)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs font-semibold text-emerald-800">
            {remainingCopy(subscription.remainingSeconds)}
          </p>
          <button
            type="button"
            onClick={onChoosePlan}
            className="mt-5 h-11 w-full rounded-md border border-stone-300 bg-white px-4 text-sm font-bold text-stone-900 hover:border-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            Extend access
          </button>
        </div>
      ) : null}
    </aside>
  );
}
