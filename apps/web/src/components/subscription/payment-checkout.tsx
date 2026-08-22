"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  getPaymentStatusRequest,
  initiateMpesaPaymentRequest,
} from "@/features/subscription/subscription.api";
import { getSubscriptionErrorMessage } from "@/features/subscription/subscription-errors";
import type {
  Payment,
  SubscriptionPlan,
} from "@/features/subscription/subscription.types";
import { formatKes, formatPlanDuration } from "@/lib/plans";

type CheckoutState =
  | "IDLE"
  | "INITIATING"
  | "PENDING"
  | "SUCCESSFUL"
  | "FAILED"
  | "CANCELLED"
  | "TIMED_OUT";

const POLL_INTERVAL_MS = 2_500;
const MAX_POLL_ATTEMPTS = 12;

function isValidKenyanPhone(value: string): boolean {
  const compact = value.trim().replace(/[\s-]/g, "");
  return /^(?:0[17]\d{8}|[17]\d{8}|(?:\+?254)[17]\d{8})$/.test(compact);
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export function PaymentCheckout({
  plan,
  onSuccess,
  onClose,
}: {
  plan: SubscriptionPlan;
  onSuccess: () => Promise<void>;
  onClose: () => void;
}) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [state, setState] = useState<CheckoutState>("IDLE");
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollController = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => pollController.current?.abort();
  }, []);

  const applyPaymentStatus = useCallback(
    async (nextPayment: Payment): Promise<boolean> => {
      setPayment(nextPayment);

      if (nextPayment.status === "SUCCESSFUL") {
        setState("SUCCESSFUL");
        setError(null);
        await onSuccess();
        return true;
      }

      if (nextPayment.status === "FAILED") {
        setState("FAILED");
        return true;
      }

      if (nextPayment.status === "CANCELLED") {
        setState("CANCELLED");
        return true;
      }

      setState("PENDING");
      return false;
    },
    [onSuccess],
  );

  const pollPayment = useCallback(
    async (paymentId: string, controller: AbortController) => {
      for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
        await wait(POLL_INTERVAL_MS);

        if (controller.signal.aborted) {
          return;
        }

        try {
          const nextPayment = await getPaymentStatusRequest(
            paymentId,
            controller.signal,
          );
          if (await applyPaymentStatus(nextPayment)) {
            return;
          }
        } catch (pollError) {
          if (controller.signal.aborted) {
            return;
          }

          setError(
            getSubscriptionErrorMessage(
              pollError,
              "We could not check the payment status.",
            ),
          );
          setState("TIMED_OUT");
          return;
        }
      }

      if (!controller.signal.aborted) {
        setState("TIMED_OUT");
      }
    },
    [applyPaymentStatus],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (state === "INITIATING" || state === "PENDING") {
      return;
    }

    setError(null);

    if (!isValidKenyanPhone(phoneNumber)) {
      setError(
        "Enter a valid Kenyan mobile number, such as 0712345678 or 254712345678.",
      );
      return;
    }

    pollController.current?.abort();
    setState("INITIATING");
    setPayment(null);

    try {
      const initiatedPayment = await initiateMpesaPaymentRequest({
        planId: plan.id,
        phoneNumber,
      });
      const isTerminal = await applyPaymentStatus(initiatedPayment);

      if (!isTerminal) {
        const controller = new AbortController();
        pollController.current = controller;
        void pollPayment(initiatedPayment.id, controller);
      }
    } catch (submitError) {
      setState("FAILED");
      setError(
        getSubscriptionErrorMessage(
          submitError,
          "The payment request could not be started.",
        ),
      );
    }
  }

  async function checkPaymentNow() {
    if (!payment) return;

    setError(null);
    try {
      const nextPayment = await getPaymentStatusRequest(payment.id);
      const isTerminal = await applyPaymentStatus(nextPayment);
      if (!isTerminal) setState("TIMED_OUT");
    } catch (statusError) {
      setError(
        getSubscriptionErrorMessage(
          statusError,
          "We could not check the payment status.",
        ),
      );
    }
  }

  function resetCheckout() {
    pollController.current?.abort();
    setPayment(null);
    setError(null);
    setState("IDLE");
  }

  const isBusy = state === "INITIATING" || state === "PENDING";

  return (
    <section
      className="border border-emerald-900 bg-white shadow-[0_18px_45px_rgba(6,78,59,0.09)]"
      aria-labelledby="checkout-title"
    >
      <div className="flex items-start justify-between gap-5 border-b border-stone-200 px-5 py-5 sm:px-7">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">
            Sandbox payment
          </p>
          <h2 id="checkout-title" className="mt-2 text-2xl font-bold tracking-[-0.03em] text-stone-950">
            Complete your {plan.name} checkout
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close checkout"
          className="grid size-10 shrink-0 place-items-center rounded-md border border-stone-300 text-lg text-stone-600 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
        >
          ×
        </button>
      </div>

      <div className="grid gap-0 md:grid-cols-[0.78fr_1.22fr]">
        <div className="border-b border-stone-200 bg-stone-50 p-5 md:border-b-0 md:border-r sm:p-7">
          <p className="text-sm font-bold text-stone-950">{plan.name}</p>
          <p className="mt-3 text-3xl font-bold tracking-[-0.04em] text-stone-950">
            {formatKes(plan.priceKes)}
          </p>
          <p className="mt-2 text-sm text-stone-600">{formatPlanDuration(plan)}</p>
          <ul className="mt-7 space-y-3 text-xs leading-5 text-stone-600">
            <li className="flex gap-2"><span className="text-emerald-700">✓</span> All platform features</li>
            <li className="flex gap-2"><span className="text-emerald-700">✓</span> Access extends existing paid time</li>
            <li className="flex gap-2"><span className="text-emerald-700">✓</span> Amount confirmed by the server</li>
          </ul>
        </div>

        <div className="p-5 sm:p-7" aria-live="polite" aria-atomic="true">
          {state === "IDLE" ? (
            <form onSubmit={handleSubmit} noValidate>
              <label htmlFor="mpesa-phone" className="text-sm font-bold text-stone-900">
                M-Pesa phone number
              </label>
              <input
                id="mpesa-phone"
                name="phoneNumber"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="07XXXXXXXX"
                aria-describedby="mpesa-phone-help checkout-error"
                className="mt-2 h-12 w-full rounded-md border border-stone-300 bg-white px-4 text-base text-stone-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
              />
              <p id="mpesa-phone-help" className="mt-2 text-xs leading-5 text-stone-500">
                Enter the Safaricom number that should receive the M-Pesa prompt.
                Formats beginning 07, 01, or 254 are accepted.
              </p>
              {error ? (
                <p id="checkout-error" role="alert" className="mt-3 text-sm font-medium text-red-700">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                className="mt-6 flex h-12 w-full items-center justify-center rounded-md bg-emerald-950 px-5 text-sm font-bold text-white transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
              >
                Pay {formatKes(plan.priceKes)} with M-Pesa
              </button>
              <p className="mt-3 text-center text-[0.68rem] leading-5 text-stone-500">
                We will never ask you to enter your M-Pesa PIN on this website.
              </p>
            </form>
          ) : null}

          {state === "INITIATING" ? (
            <PaymentState
              tone="progress"
              title="Sending payment request…"
              description="Connecting securely to M-Pesa. Please keep this page open."
            />
          ) : null}

          {state === "PENDING" ? (
            <PaymentState
              tone="progress"
              title="Check your phone"
              description="An STK push was sent. Enter your M-Pesa PIN only in the secure prompt on your phone."
            />
          ) : null}

          {state === "SUCCESSFUL" ? (
            <PaymentState
              tone="success"
              title="Payment confirmed"
              description="Your access is now active. The updated paid-through date is shown in your dashboard."
            >
              <button
                type="button"
                onClick={onClose}
                className="mt-6 h-11 rounded-md bg-emerald-950 px-5 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
              >
                Continue to dashboard
              </button>
            </PaymentState>
          ) : null}

          {state === "FAILED" || state === "CANCELLED" ? (
            <PaymentState
              tone="error"
              title={state === "CANCELLED" ? "Payment was cancelled" : "Payment could not be completed"}
              description={
                error ??
                (state === "CANCELLED"
                  ? "No charge was confirmed. You can start a new request when ready."
                  : "No access was activated. Check the phone number and try again.")
              }
            >
              <button
                type="button"
                onClick={resetCheckout}
                className="mt-6 h-11 rounded-md border border-stone-300 bg-white px-5 text-sm font-bold text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
              >
                Try again
              </button>
            </PaymentState>
          ) : null}

          {state === "TIMED_OUT" ? (
            <PaymentState
              tone="neutral"
              title="We haven&apos;t confirmed the payment yet"
              description={error ?? "The request may still be processing. You can check its status again without starting another payment."}
            >
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void checkPaymentNow()}
                  className="h-11 rounded-md bg-emerald-950 px-5 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                >
                  Check payment status
                </button>
                <button
                  type="button"
                  onClick={resetCheckout}
                  className="h-11 rounded-md border border-stone-300 bg-white px-5 text-sm font-bold text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                >
                  Start again
                </button>
              </div>
            </PaymentState>
          ) : null}

          {isBusy ? (
            <span className="sr-only" role="status">Payment processing is in progress.</span>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function PaymentState({
  tone,
  title,
  description,
  children,
}: {
  tone: "progress" | "success" | "error" | "neutral";
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  const styles = {
    progress: "bg-amber-100 text-amber-900",
    success: "bg-emerald-100 text-emerald-900",
    error: "bg-red-100 text-red-800",
    neutral: "bg-stone-200 text-stone-700",
  };
  const symbols = { progress: "…", success: "✓", error: "!", neutral: "i" };

  return (
    <div className="flex min-h-64 flex-col items-start justify-center">
      <span className={`grid size-11 place-items-center rounded-full text-lg font-bold ${styles[tone]}`} aria-hidden="true">
        {symbols[tone]}
      </span>
      <h3 className="mt-5 text-xl font-bold tracking-tight text-stone-950">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-stone-600">{description}</p>
      {children}
    </div>
  );
}
