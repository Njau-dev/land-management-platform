import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Password reset is coming soon"
      description="The secure password-reset workflow is planned but is not enabled in this phase."
    >
      <div className="border-l-3 border-amber-700 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
        If you cannot access your account during development, contact the platform
        administrator. No password-reset request has been submitted from this
        page.
      </div>
      <Link
        href="/login"
        className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-emerald-950 px-4 text-sm font-semibold text-white transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
      >
        Return to sign in
      </Link>
    </AuthShell>
  );
}
