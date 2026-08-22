export type MarketingIconName =
  | "status"
  | "rate"
  | "zoning"
  | "lien"
  | "history"
  | "report";

export function MarketingIcon({ name }: { name: MarketingIconName }) {
  const commonProps = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "status") {
    return <svg {...commonProps}><path d="m4 12 5 5L20 6" /></svg>;
  }

  if (name === "rate") {
    return <svg {...commonProps}><path d="M4 19V9m6 10V5m6 14v-7m4 7H2" /></svg>;
  }

  if (name === "zoning") {
    return <svg {...commonProps}><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" /><path d="M9 3v15m6-12v15" /></svg>;
  }

  if (name === "lien") {
    return <svg {...commonProps}><path d="M3 10h18M5 10V8l7-4 7 4v2M6 10v7m4-7v7m4-7v7m4-7v7M3 20h18" /></svg>;
  }

  if (name === "history") {
    return <svg {...commonProps}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5m4-2v6l4 2" /></svg>;
  }

  return <svg {...commonProps}><path d="M7 3h7l4 4v14H7V3Z" /><path d="M14 3v5h5M10 13h5m-5 4h5" /></svg>;
}
