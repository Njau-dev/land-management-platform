import type { LandSearchResult } from "@/features/land-search/land-search.types";

function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string | null): string {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDecimalKes(value: string): string {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(value);
  if (!match) return `KSh ${value}`;
  const integer = (match[1] ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const fraction = (match[2] ?? "00").padEnd(2, "0").slice(0, 2);
  return `KSh ${integer}.${fraction}`;
}

const availabilityStyles = {
  AVAILABLE: "border-emerald-200 bg-emerald-50 text-emerald-900",
  SOLD: "border-stone-300 bg-stone-100 text-stone-800",
  UNDER_TRANSACTION: "border-amber-200 bg-amber-50 text-amber-900",
} as const;

const encumbranceStyles = {
  CLEAR: "bg-emerald-50 text-emerald-900",
  ACTIVE: "bg-amber-50 text-amber-900",
  OVERDUE: "bg-red-50 text-red-800",
} as const;

export function LandSearchResultView({
  result,
  isDownloading,
  reportError,
  onDownload,
  onNewSearch,
}: {
  result: LandSearchResult;
  isDownloading: boolean;
  reportError: string | null;
  onDownload: () => void;
  onNewSearch: () => void;
}) {
  const deed = result.titleDeed;

  return (
    <div className="mt-8 space-y-5" aria-labelledby="land-result-title">
      <section className="overflow-hidden border border-emerald-200 bg-white shadow-[0_18px_45px_rgba(6,78,59,0.07)]">
        <div className="border-b border-stone-200 bg-emerald-950 px-5 py-6 text-white sm:px-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                Search result
              </p>
              <h3
                id="land-result-title"
                className="mt-2 break-words font-mono text-xl font-bold tracking-[-0.02em] sm:text-2xl"
              >
                {deed.titleDeedNumber}
              </h3>
              <p className="mt-2 text-sm text-emerald-100/70">{deed.location}</p>
            </div>
            <span
              className={`w-fit shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${availabilityStyles[deed.availabilityStatus]}`}
            >
              {humanize(deed.availabilityStatus)}
            </span>
          </div>
        </div>

        <div className="grid gap-px bg-stone-200 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryItem label="Current owner" value={deed.ownerName} />
          <SummaryItem label="Parcel size" value={deed.size} />
          <SummaryItem label="Estimated land rate" value={formatDecimalKes(deed.landRate)} />
          <SummaryItem label="Record checked" value={formatDate(result.searchedAt)} />
        </div>
        <div className="border-t border-stone-200 bg-stone-50 px-5 py-3 text-xs leading-5 text-stone-600 sm:px-7">
          Parcel-size units are not specified in the current dataset. Rates are seeded development estimates, not official valuations.
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="border border-stone-200 bg-white p-5 sm:p-7" aria-labelledby="zoning-title">
          <SectionHeading eyebrow="Planning" title="Zoning" id="zoning-title" />
          {result.zoning ? (
            <div className="mt-5 space-y-4">
              <Detail label="Classification" value={humanize(result.zoning.zoneType)} />
              <Detail label="Notes" value={result.zoning.notes ?? "No notes recorded."} />
              <Detail
                label="Restrictions"
                value={result.zoning.restrictions ?? "No restrictions recorded in the current dataset."}
              />
            </div>
          ) : (
            <EmptyState>No zoning record is present in the current dataset.</EmptyState>
          )}
        </section>

        <section className="border border-stone-200 bg-white p-5 sm:p-7" aria-labelledby="encumbrances-title">
          <SectionHeading eyebrow="Recorded interests" title="Loans and liens" id="encumbrances-title" />
          {result.loansLiens.length === 0 ? (
            <EmptyState>No loan or lien records are present in the current dataset.</EmptyState>
          ) : (
            <div className="mt-5 space-y-3">
              {result.loansLiens.map((record, index) => (
                <article key={`${record.lender}-${record.type}-${index}`} className="border border-stone-200 bg-stone-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-stone-950">{record.lender}</p>
                      <p className="mt-1 text-xs uppercase tracking-wider text-stone-500">{humanize(record.type)}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wider ${encumbranceStyles[record.status]}`}>
                      {humanize(record.status)}
                    </span>
                  </div>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <Detail label="Recorded amount" value={formatDecimalKes(record.amount)} />
                    <Detail label="Due date" value={formatDate(record.dueDate)} />
                  </dl>
                  {record.notes ? <p className="mt-3 text-xs leading-5 text-stone-600">{record.notes}</p> : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="border border-stone-200 bg-white p-5 sm:p-7" aria-labelledby="ownership-title">
        <SectionHeading eyebrow="History" title="Ownership timeline" id="ownership-title" />
        <p className="mt-2 text-xs text-stone-500">Most recent recorded transfer first.</p>
        {result.ownershipHistory.length === 0 ? (
          <EmptyState>No ownership-history records are present in the current dataset.</EmptyState>
        ) : (
          <ol className="mt-6 space-y-0">
            {result.ownershipHistory.map((record, index) => (
              <li key={`${record.ownerName}-${record.transferDate}-${index}`} className="relative grid gap-1 border-l border-emerald-200 pb-6 pl-6 last:border-transparent last:pb-0 sm:grid-cols-[1fr_auto] sm:gap-x-6">
                <span className="absolute -left-1.5 top-1 size-3 rounded-full border-2 border-white bg-emerald-700" aria-hidden="true" />
                <p className="text-sm font-bold text-stone-950">{record.ownerName}</p>
                <time dateTime={record.transferDate} className="text-xs font-semibold text-stone-500 sm:text-right">
                  {formatDate(record.transferDate)}
                </time>
                {record.notes ? <p className="text-xs leading-5 text-stone-600 sm:col-span-2">{record.notes}</p> : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="flex flex-col gap-4 border border-stone-200 bg-stone-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h3 className="text-base font-bold text-stone-950">Take this result with you</h3>
          <p className="mt-1 text-xs leading-5 text-stone-600">
            Download a professional PDF containing the same development-data result.
          </p>
          {reportError ? <p className="mt-2 text-sm font-medium text-red-700" role="alert">{reportError}</p> : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onNewSearch}
            className="h-11 rounded-md border border-stone-300 bg-white px-5 text-sm font-bold text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            New search
          </button>
          <button
            type="button"
            onClick={onDownload}
            disabled={isDownloading}
            className="h-11 rounded-md bg-emerald-950 px-5 text-sm font-bold text-white transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-65"
          >
            {isDownloading ? "Preparing report…" : "Download PDF report"}
          </button>
        </div>
      </section>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 bg-white px-5 py-5">
      <p className="text-[0.68rem] font-bold uppercase tracking-wider text-stone-500">{label}</p>
      <p className="mt-2 break-words text-sm font-bold text-stone-950">{value}</p>
    </div>
  );
}

function SectionHeading({ eyebrow, title, id }: { eyebrow: string; title: string; id: string }) {
  return (
    <div>
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-emerald-800">{eyebrow}</p>
      <h3 id={id} className="mt-2 text-xl font-bold tracking-[-0.025em] text-stone-950">{title}</h3>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.68rem] font-bold uppercase tracking-wider text-stone-500">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-stone-800">{value}</dd>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="mt-5 border border-dashed border-stone-300 bg-stone-50 p-4 text-sm leading-6 text-stone-600">{children}</p>;
}
