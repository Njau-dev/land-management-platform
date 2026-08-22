"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { AuthLoading } from "@/components/auth/auth-loading";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormMessage } from "@/components/auth/form-message";
import { FormField } from "@/components/ui/form-field";
import { getDashboardHref, type PlanIntent } from "@/lib/plans";

import { getAuthErrorMessage } from "./auth-errors";
import { useAuth } from "./use-auth";

export function SignupForm({ selectedPlan }: { selectedPlan: PlanIntent | null }) {
  const router = useRouter();
  const { isAuthenticated, isInitializing, signup, user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      router.replace(
        user?.role === "ADMIN" ? "/admin" : getDashboardHref(selectedPlan),
      );
    }
  }, [isAuthenticated, isInitializing, router, selectedPlan, user?.role]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError(null);

    if (name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (password.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }

    if (new TextEncoder().encode(password).length > 72) {
      setError("Password must not exceed 72 UTF-8 bytes.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await signup({ name: name.trim(), email, password });
      router.replace(getDashboardHref(selectedPlan));
    } catch (submitError) {
      setError(getAuthErrorMessage(submitError, "Unable to create your account."));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isInitializing) {
    return <AuthLoading />;
  }

  return (
    <AuthShell
      eyebrow="Create your workspace"
      title="Start with a secure account"
      description="Your account unlocks the dashboard. A subscription will only be needed for paid operations introduced later."
    >
      {selectedPlan ? (
        <div className="mb-6 border-l-3 border-emerald-800 bg-emerald-50 px-4 py-3.5">
          <p className="text-sm font-bold text-emerald-950">
            You&apos;ve selected the {selectedPlan.name} plan.
          </p>
          <p className="mt-1 text-xs leading-5 text-emerald-900/70">
            Create your account to view the current server-backed price and continue securely.
          </p>
        </div>
      ) : null}

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <FormMessage message={error} />
        <FormField
          id="name"
          label="Full name"
          name="name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={isSubmitting}
        />
        <FormField
          id="email"
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isSubmitting}
        />
        <FormField
          id="password"
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isSubmitting}
          hint="Use at least 12 characters. Long passphrases are encouraged."
        />
        <FormField
          id="confirm-password"
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-11 w-full items-center justify-center rounded-md bg-emerald-950 px-4 text-sm font-semibold text-white transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-stone-600">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-emerald-800 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
