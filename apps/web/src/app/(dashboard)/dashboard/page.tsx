import { DashboardClient } from "./dashboard-client";
import { getPlan } from "@/lib/plans";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string | string[] }>;
}) {
  const query = await searchParams;
  const selectedPlan = getPlan(query.plan);

  return <DashboardClient selectedPlan={selectedPlan} />;
}
