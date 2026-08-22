"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { AdminGuard } from "@/components/auth/admin-guard";
import { Brand } from "@/components/marketing/brand";
import { useAuth } from "@/features/auth/use-auth";

const navigation = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/title-deeds", label: "Title deeds" },
  { href: "/admin/zoning", label: "Zoning" },
  { href: "/admin/loans", label: "Loans & liens" },
  { href: "/admin/ownership-history", label: "Ownership history" },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <AdminShellContent>{children}</AdminShellContent>
    </AdminGuard>
  );
}

function AdminShellContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  function isActive(href: string): boolean {
    return href === "/admin" ? pathname === href : pathname.startsWith(href);
  }

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await logout();
  }

  return (
    <div className="min-h-screen bg-[#f6f5f0] text-stone-950 lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="hidden min-h-screen border-r border-emerald-900 bg-emerald-950 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="border-b border-white/10 px-6 py-6">
          <Brand inverse />
          <p className="mt-4 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-emerald-300">Administration</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-5" aria-label="Administration">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
                isActive(item.href)
                  ? "bg-white text-emerald-950"
                  : "text-emerald-100/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-5">
          <p className="truncate text-sm font-bold">{user?.name}</p>
          <p className="mt-1 truncate text-xs text-emerald-100/60">{user?.email}</p>
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}
            className="mt-4 w-full rounded-md border border-white/20 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:opacity-60"
          >
            {isLoggingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="border-b border-stone-200 bg-white px-5 py-4 sm:px-8 lg:hidden">
          <div className="flex items-center justify-between gap-4">
            <Brand />
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
              className="rounded-md border border-stone-300 px-3 py-2 text-xs font-bold text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-60"
            >
              {isLoggingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
          <label htmlFor="admin-mobile-navigation" className="sr-only">Administration section</label>
          <select
            id="admin-mobile-navigation"
            value={navigation.find((item) => isActive(item.href))?.href ?? "/admin"}
            onChange={(event) => router.push(event.target.value)}
            className="mt-4 h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
          >
            {navigation.map((item) => <option key={item.href} value={item.href}>{item.label}</option>)}
          </select>
        </header>

        <main className="mx-auto min-h-screen max-w-[100rem] px-5 py-7 sm:px-8 sm:py-10 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
