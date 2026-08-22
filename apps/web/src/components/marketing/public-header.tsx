"use client";

import Link from "next/link";
import { useState } from "react";

import { useAuth } from "@/features/auth/use-auth";

import { Brand } from "./brand";

const navigation = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
];

export function PublicHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, isInitializing } = useAuth();
  const primaryHref = isAuthenticated ? "/dashboard" : "/signup";
  const primaryLabel = isAuthenticated ? "Open dashboard" : "Get started";

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-[#fbfaf6]/95 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Brand />

        <nav aria-label="Primary navigation" className="hidden items-center gap-8 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-sm text-sm font-medium text-stone-600 transition hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-md px-3 py-2 text-sm font-semibold text-stone-700 transition hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            Login
          </Link>
          <Link
            href={isInitializing ? "/signup" : primaryHref}
            className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-950 px-4 text-sm font-semibold text-white transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
          >
            {isInitializing ? "Get started" : primaryLabel}
          </Link>
        </div>

        <button
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsOpen((current) => !current)}
          className="grid size-10 place-items-center rounded-md border border-stone-300 bg-white text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 md:hidden"
        >
          <span aria-hidden="true" className="space-y-1.5">
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
          </span>
        </button>
      </div>

      {isOpen ? (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="border-t border-stone-200 bg-[#fbfaf6] px-5 py-5 md:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className="rounded-md px-3 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-stone-200 pt-4">
              <Link
                href="/login"
                onClick={closeMenu}
                className="inline-flex h-11 items-center justify-center rounded-md border border-stone-300 bg-white text-sm font-semibold text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
              >
                Login
              </Link>
              <Link
                href={isInitializing ? "/signup" : primaryHref}
                onClick={closeMenu}
                className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-950 px-3 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
              >
                {isInitializing ? "Get started" : primaryLabel}
              </Link>
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
