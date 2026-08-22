import Link from "next/link";

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Ardhi home"
      className={`inline-flex items-center gap-2 rounded-sm text-lg font-bold tracking-[-0.03em] outline-none focus-visible:ring-2 focus-visible:ring-offset-4 ${
        inverse
          ? "text-white focus-visible:ring-emerald-300 focus-visible:ring-offset-emerald-950"
          : "text-stone-950 focus-visible:ring-emerald-700"
      }`}
    >
      <span
        aria-hidden="true"
        className={`grid size-8 place-items-center rounded-md ${
          inverse ? "bg-white text-emerald-950" : "bg-emerald-950 text-white"
        }`}
      >
        A
      </span>
      <span>
        Ardhi<span className={inverse ? "text-amber-300" : "text-amber-700"}>.</span>
      </span>
    </Link>
  );
}
