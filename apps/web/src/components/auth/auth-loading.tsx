export function AuthLoading({ label = "Restoring your session…" }: { label?: string }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-stone-50 px-6"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 text-sm font-medium text-stone-600">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" />
        {label}
      </div>
    </div>
  );
}
