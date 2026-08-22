export function ReportPreview() {
  return (
    <div className="relative mx-auto w-full max-w-2xl lg:mx-0">
      <div className="absolute -inset-5 -z-10 rounded-[2rem] bg-emerald-900/[0.05]" />
      <div className="overflow-hidden rounded-xl border border-stone-300 bg-white shadow-[0_24px_70px_rgba(28,25,23,0.13)]">
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-stone-300" />
            <span className="size-2 rounded-full bg-stone-300" />
            <span className="size-2 rounded-full bg-stone-300" />
          </div>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-amber-800">
            Illustrative seeded record
          </span>
        </div>

        <div className="p-4 sm:p-6">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-stone-500">Title deed search</p>
          <div className="mt-3 flex gap-2">
            <div className="min-w-0 flex-1 rounded-md border border-stone-300 bg-stone-50 px-3 py-3 font-mono text-xs font-semibold text-stone-700 sm:text-sm">
              NAIROBI/BLOCK-XX/XXXX
            </div>
            <div className="grid size-11 shrink-0 place-items-center rounded-md bg-emerald-950 text-white" aria-hidden="true">⌕</div>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-b border-stone-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs text-stone-500">Consolidated title view</p>
              <h2 className="mt-1 text-lg font-bold tracking-tight text-stone-950">Westlands, Nairobi</h2>
            </div>
            <span className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-emerald-800">
              Available
            </span>
          </div>

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-stone-200 bg-stone-200 sm:grid-cols-3">
            {[
              ["Estimated rate", "KSh 18.5M"],
              ["Zoning", "Residential"],
              ["Parcel size", "0.18 ha"],
            ].map(([label, value]) => (
              <div key={label} className="bg-stone-50 p-3.5">
                <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-stone-500">{label}</p>
                <p className="mt-2 text-xs font-bold text-stone-900 sm:text-sm">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-stone-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-stone-900">Loans / liens</p>
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-700">Clear</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-stone-500">No active seeded encumbrance shown.</p>
            </div>
            <div className="rounded-lg border border-stone-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-stone-900">Ownership history</p>
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-stone-500">3 entries</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-stone-500">Chronological transfer records available.</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-lg bg-emerald-950 px-4 py-3 text-white">
            <div>
              <p className="text-xs font-bold">Consolidated report</p>
              <p className="mt-0.5 text-[0.65rem] text-emerald-100/60">PDF download preview</p>
            </div>
            <span aria-hidden="true" className="text-lg">↓</span>
          </div>
        </div>
      </div>
    </div>
  );
}
