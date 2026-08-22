export const PLAN_SLUGS = ["weekly", "monthly", "annual"] as const;

export type PlanSlug = (typeof PLAN_SLUGS)[number];

export interface PlanIntent {
  slug: PlanSlug;
  name: string;
}

interface PlanLike {
  name: string;
  priceKes: number;
  interval: "WEEK" | "MONTH" | "YEAR";
  intervalCount: number;
}

const planNames: Record<PlanSlug, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  annual: "Annual",
};

export function getPlan(value: string | string[] | undefined): PlanIntent | null {
  if (
    typeof value !== "string" ||
    !PLAN_SLUGS.includes(value as PlanSlug)
  ) {
    return null;
  }

  const slug = value as PlanSlug;
  return { slug, name: planNames[slug] };
}

export function getPlanSlug(name: string): PlanSlug | null {
  const normalized = name.trim().toLowerCase();
  return PLAN_SLUGS.find((slug) => slug === normalized) ?? null;
}

export function getPlanIntentHref(
  plan: PlanSlug,
  isAuthenticated: boolean,
): string {
  const destination = isAuthenticated ? "/dashboard" : "/signup";
  return `${destination}?plan=${plan}`;
}

export function getDashboardHref(plan?: PlanIntent | null): string {
  return plan ? `/dashboard?plan=${plan.slug}` : "/dashboard";
}

export function formatKes(amount: number): string {
  return `KSh ${new Intl.NumberFormat("en-KE", {
    maximumFractionDigits: 0,
  }).format(amount)}`;
}

export function formatPlanDuration(plan: PlanLike): string {
  const units = {
    WEEK: ["week", "weeks"],
    MONTH: ["month", "months"],
    YEAR: ["year", "years"],
  } as const;
  const labels = units[plan.interval];
  const unit = plan.intervalCount === 1 ? labels[0] : labels[1];
  return `${plan.intervalCount} ${unit} access`;
}

export function planOrder(name: string): number {
  const slug = getPlanSlug(name);
  return slug ? PLAN_SLUGS.indexOf(slug) : PLAN_SLUGS.length;
}
