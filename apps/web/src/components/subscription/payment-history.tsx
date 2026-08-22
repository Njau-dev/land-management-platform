import type {
  LoadStatus,
  Payment,
} from "@/features/subscription/subscription.types";
import { formatKes } from "@/lib/plans";

const statusStyles = {
  INITIATED: "bg-stone-100 text-stone-700",
  PENDING: "bg-amber-100 text-amber-900",
  SUCCESSFUL: "bg-emerald-100 text-emerald-900",
  FAILED: "bg-red-100 text-red-800",
  CANCELLED: "bg-stone-200 text-stone-700",
} as const;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function PaymentHistory({
  payments,
  status,
  error,
  onRetry,
}: {
  payments: Payment[];
  status: LoadStatus;
  error: string | null;
  onRetry: () => Promise<void>;
}) {
  return (
    <section className="border border-stone-200 bg-white" aria-labelledby="payment-history-title">
      <div className="border-b border-stone-200 px-5 py-5 sm:px-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Account activity</p>
        <h2 id="payment-history-title" className="mt-2 text-xl font-bold tracking-tight text-stone-950">Payment history</h2>
      </div>
      <div className="p-5 sm:p-7">
        {status === "loading" ? (
          <p className="text-sm text-stone-500" role="status">Loading payment history…</p>
        ) : null}
        {status === "error" ? (
          <div role="alert">
            <p className="text-sm text-red-700">{error}</p>
            <button type="button" onClick={() => void onRetry()} className="mt-3 text-sm font-bold text-emerald-800 underline underline-offset-4">
              Retry
            </button>
          </div>
        ) : null}
        {status === "ready" && payments.length === 0 ? (
          <p className="text-sm text-stone-500">No payments yet.</p>
        ) : null}
        {status === "ready" && payments.length > 0 ? (
          <div className="divide-y divide-stone-200">
            {payments.slice(0, 6).map((payment) => (
              <article key={payment.id} className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1.2fr_0.8fr_auto] sm:items-center">
                <div>
                  <p className="text-sm font-bold text-stone-900">{payment.plan.name}</p>
                  <p className="mt-1 text-xs text-stone-500">{formatDate(payment.createdAt)}</p>
                  {payment.mpesaReceiptNumber ? (
                    <p className="mt-1 font-mono text-[0.65rem] text-stone-500">{payment.mpesaReceiptNumber}</p>
                  ) : null}
                </div>
                <p className="text-sm font-bold text-stone-900">{formatKes(payment.amountKes)}</p>
                <span className={`w-fit rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider ${statusStyles[payment.status]}`}>
                  {payment.status.toLowerCase()}
                </span>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
