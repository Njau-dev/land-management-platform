"use client";

import { useEffect, useRef, type ReactNode } from "react";

import type { Pagination } from "@/features/admin/admin.types";

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-stone-950 sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function AdminLoading({ label = "Loading records…" }: { label?: string }) {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" role="status">
      <span className="sr-only">{label}</span>
      {[0, 1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse border border-stone-200 bg-white" />)}
    </div>
  );
}

export function AdminError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mt-8 border border-red-200 bg-red-50 p-6" role="alert">
      <p className="font-bold text-red-900">The data could not be loaded</p>
      <p className="mt-2 text-sm text-red-800/80">{message}</p>
      <button type="button" onClick={onRetry} className="mt-4 text-sm font-bold text-red-900 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700">Try again</button>
    </div>
  );
}

export function AdminEmpty({ children }: { children: ReactNode }) {
  return <div className="border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-600">{children}</div>;
}

export function AdminPagination({
  pagination,
  onPage,
}: {
  pagination: Pagination;
  onPage: (page: number) => void;
}) {
  if (pagination.totalPages <= 1) return null;
  return (
    <nav className="mt-5 flex items-center justify-between gap-4" aria-label="Pagination">
      <p className="text-xs text-stone-500">Page {pagination.page} of {pagination.totalPages} · {pagination.total} records</p>
      <div className="flex gap-2">
        <button type="button" disabled={pagination.page <= 1} onClick={() => onPage(pagination.page - 1)} className="h-10 rounded-md border border-stone-300 bg-white px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">Previous</button>
        <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => onPage(pagination.page + 1)} className="h-10 rounded-md border border-stone-300 bg-white px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">Next</button>
      </div>
    </nav>
  );
}

export function AdminBadge({ value }: { value: string }) {
  const normalized = value.toUpperCase();
  const tone =
    normalized === "ACTIVE" || normalized === "AVAILABLE" || normalized === "CLEAR"
      ? "bg-emerald-50 text-emerald-900"
      : normalized === "SUSPENDED" || normalized === "OVERDUE" || normalized === "SOLD"
        ? "bg-red-50 text-red-800"
        : "bg-amber-50 text-amber-900";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wider ${tone}`}>{humanize(value)}</span>;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  isBusy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  isBusy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-stone-950/55 p-4" role="presentation" onKeyDown={(event) => { if (event.key === "Escape" && !isBusy) onCancel(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-6 shadow-2xl">
        <h2 id="confirm-title" className="text-xl font-bold text-stone-950">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-stone-600">{description}</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button ref={cancelRef} type="button" disabled={isBusy} onClick={onCancel} className="h-11 rounded-md border border-stone-300 px-5 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">Cancel</button>
          <button type="button" disabled={isBusy} onClick={onConfirm} className="h-11 rounded-md bg-red-700 px-5 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:opacity-60">{isBusy ? "Working…" : confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}

export function humanize(value: string): string {
  return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export function formatAdminDate(value: string | null): string {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export function formatAdminKes(value: number | string): string {
  if (typeof value === "string") {
    const match = /^(\d+)(?:\.(\d+))?$/.exec(value);
    if (match) {
      const integer = (match[1] ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      const fraction = match[2];
      return `KSh ${integer}${fraction ? `.${fraction.padEnd(2, "0").slice(0, 2)}` : ""}`;
    }
    return `KSh ${value}`;
  }
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(value);
}
