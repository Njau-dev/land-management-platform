import type { ReactNode } from "react";

import { Brand } from "@/components/marketing/brand";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="grid min-h-screen bg-[#fbfaf6] lg:grid-cols-[minmax(0,1fr)_minmax(480px,0.78fr)]">
      <section className="relative hidden overflow-hidden bg-emerald-950 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="land-grid pointer-events-none absolute inset-0 opacity-20" />
        <div className="relative"><Brand inverse /></div>

        <div className="relative max-w-lg">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.24em] text-emerald-300">
            Clear land information
          </p>
          <h2 className="text-4xl font-bold leading-tight tracking-[-0.04em] xl:text-5xl">
            Understand the record before the next decision.
          </h2>
          <p className="mt-6 max-w-md text-base leading-7 text-emerald-100/75">
            One secure workspace for reviewing availability, estimated rates,
            zoning, encumbrances, and ownership history.
          </p>
          <div className="mt-9 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-white/15 bg-white/15">
            {[["01", "Account"], ["02", "Choose plan"], ["03", "Search"]].map(([number, label]) => (
              <div key={number} className="bg-emerald-950/90 p-4">
                <p className="font-mono text-[0.65rem] font-bold text-amber-300">{number}</p>
                <p className="mt-2 text-xs font-semibold text-emerald-50">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs leading-5 text-emerald-100/55">
          Current MVP · Synthetic seeded data · No official registry connection
        </p>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-14 xl:px-20">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden"><Brand /></div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-stone-950">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-stone-600">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  );
}
