"use client";

import { useCallback, useState, type FormEvent } from "react";

import { downloadLandReportRequest } from "@/features/land-search/land-search.api";
import {
  getLandSearchErrorMessage,
  isSubscriptionRequired,
} from "@/features/land-search/land-search.errors";
import { useLandSearch } from "@/features/land-search/use-land-search";
import { useSubscription } from "@/features/subscription/use-subscription";

import { LandSearchResultView } from "./land-search-result";

export function LandSearchPanel({ onChoosePlan }: { onChoosePlan: () => void }) {
  const {
    activeSubscription,
    subscriptionStatus,
    subscriptionError,
    refreshSubscription,
  } = useSubscription();
  const [titleDeedNumber, setTitleDeedNumber] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [accessNotice, setAccessNotice] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const handleSubscriptionRequired = useCallback(async () => {
    setAccessNotice(
      "Your subscription has ended. Choose or extend a plan to continue searching.",
    );
    await refreshSubscription();
  }, [refreshSubscription]);

  const { result, status, error, search, clear } = useLandSearch(
    handleSubscriptionRequired,
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = titleDeedNumber.trim();
    setValidationError(null);
    setReportError(null);

    if (!normalized) {
      setValidationError("Enter a title deed number to search.");
      return;
    }

    if (normalized.length > 100) {
      setValidationError("The title deed number is too long.");
      return;
    }

    setTitleDeedNumber(normalized);
    void search(normalized);
  }

  async function downloadReport() {
    if (!result || isDownloading) return;

    setIsDownloading(true);
    setReportError(null);
    try {
      const report = await downloadLandReportRequest(
        result.titleDeed.titleDeedNumber,
      );
      const objectUrl = URL.createObjectURL(report.blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = report.filename ?? "land-search-report.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    } catch (downloadError) {
      setReportError(
        getLandSearchErrorMessage(
          downloadError,
          "The PDF report could not be prepared. Please try again.",
        ),
      );
      if (isSubscriptionRequired(downloadError)) {
        await handleSubscriptionRequired();
      }
    } finally {
      setIsDownloading(false);
    }
  }

  function startNewSearch() {
    clear();
    setReportError(null);
    setValidationError(null);
    setTitleDeedNumber("");
    window.requestAnimationFrame(() => {
      document.getElementById("title-deed-number")?.focus();
    });
  }

  if (subscriptionStatus === "loading") {
    return (
      <section id="search" className="scroll-mt-24 border border-stone-200 bg-white p-6 sm:p-8" aria-busy="true">
        <div className="h-5 w-36 animate-pulse rounded bg-stone-200" />
        <div className="mt-4 h-9 max-w-md animate-pulse rounded bg-stone-200" />
        <div className="mt-7 h-12 animate-pulse rounded bg-stone-100" />
      </section>
    );
  }

  if (subscriptionStatus === "error") {
    return (
      <section id="search" className="scroll-mt-24 border border-amber-200 bg-amber-50 p-6 sm:p-8" role="alert">
        <h2 className="text-xl font-bold text-amber-950">Search access could not be checked</h2>
        <p className="mt-2 text-sm text-amber-900/75">{subscriptionError}</p>
        <button type="button" onClick={() => void refreshSubscription()} className="mt-4 text-sm font-bold text-emerald-900 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
          Try again
        </button>
      </section>
    );
  }

  if (!activeSubscription) {
    return (
      <section id="search" className="scroll-mt-24 border border-stone-200 bg-stone-100 p-6 sm:p-8" aria-labelledby="locked-search-title">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Title deed lookup</p>
            <h2 id="locked-search-title" className="mt-2 text-2xl font-bold tracking-[-0.03em] text-stone-950">Search unlocks with an active plan</h2>
          </div>
          <span className="w-fit rounded-full bg-stone-200 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-stone-700">Locked</span>
        </div>
        <div className="mt-7 flex flex-col gap-2 sm:flex-row" aria-disabled="true">
          <div className="flex h-12 min-w-0 flex-1 items-center rounded-md border border-stone-300 bg-white px-4 font-mono text-sm text-stone-400">SYNTH/NRB/KAS/001/2026</div>
          <button type="button" disabled className="h-12 rounded-md bg-stone-300 px-6 text-sm font-bold text-stone-600 disabled:cursor-not-allowed">Search</button>
        </div>
        <p className="mt-4 text-sm leading-6 text-stone-600">
          {accessNotice ?? "Choose an access plan to search title deeds in the current demo dataset."}
        </p>
        <button type="button" onClick={onChoosePlan} className="mt-5 text-sm font-bold text-emerald-800 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
          Choose a plan
        </button>
      </section>
    );
  }

  return (
    <section id="search" className="scroll-mt-24" aria-labelledby="search-title">
      <div className="border border-emerald-200 bg-white p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Title deed lookup</p>
            <h2 id="search-title" className="mt-2 text-2xl font-bold tracking-[-0.03em] text-stone-950">Search a title deed</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">Enter a title deed number to view available property information from the seeded development dataset.</p>
          </div>
          <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-emerald-900">Access active</span>
        </div>

        <form onSubmit={handleSubmit} className="mt-7" noValidate>
          <label htmlFor="title-deed-number" className="text-sm font-bold text-stone-900">Title deed number</label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id="title-deed-number"
              name="titleDeedNumber"
              type="text"
              value={titleDeedNumber}
              onChange={(event) => setTitleDeedNumber(event.target.value)}
              placeholder="SYNTH/NRB/KAS/001/2026"
              autoComplete="off"
              maxLength={100}
              aria-describedby="title-search-help title-search-message"
              className="h-12 min-w-0 flex-1 rounded-md border border-stone-300 bg-white px-4 font-mono text-sm text-stone-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="h-12 rounded-md bg-emerald-950 px-7 text-sm font-bold text-white transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-65"
            >
              {status === "loading" ? "Searching…" : "Search"}
            </button>
          </div>
          <p id="title-search-help" className="mt-2 text-xs leading-5 text-stone-500">Use the title deed number exactly as it appears in the current dataset.</p>
          <div id="title-search-message" aria-live="polite">
            {validationError || error ? (
              <p className="mt-3 text-sm font-medium text-red-700" role="alert">{validationError ?? error}</p>
            ) : null}
          </div>
        </form>
      </div>

      {result ? (
        <LandSearchResultView
          result={result}
          isDownloading={isDownloading}
          reportError={reportError}
          onDownload={() => void downloadReport()}
          onNewSearch={startNewSearch}
        />
      ) : null}
    </section>
  );
}
