"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { AuthLoading } from "@/components/auth/auth-loading";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormMessage } from "@/components/auth/form-message";
import { FormField } from "@/components/ui/form-field";
import { getAuthErrorMessage } from "@/features/auth/auth-errors";
import { useAuth } from "@/features/auth/use-auth";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isInitializing, login, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      router.replace(user?.role === "ADMIN" ? "/admin" : "/dashboard");
    }
  }, [isAuthenticated, isInitializing, router, user?.role]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      router.replace("/dashboard");
    } catch (submitError) {
      setError(getAuthErrorMessage(submitError, "Unable to sign in."));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isInitializing) {
    return <AuthLoading />;
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to your workspace"
      description="Access your dashboard and account. No subscription is required to sign in."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <FormMessage message={error} />
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
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-stone-800">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="rounded-sm text-xs font-semibold text-emerald-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isSubmitting}
            className="h-11 w-full rounded-md border border-stone-300 bg-white px-3.5 text-sm text-stone-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15 disabled:cursor-not-allowed disabled:bg-stone-100"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-11 w-full items-center justify-center rounded-md bg-emerald-950 px-4 text-sm font-semibold text-white transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-stone-600">
        New to Ardhi?{" "}
        <Link
          href="/signup"
          className="font-semibold text-emerald-800 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
