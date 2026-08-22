import { SignupForm } from "@/features/auth/signup-form";
import { getPlan } from "@/lib/plans";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string | string[] }>;
}) {
  const query = await searchParams;
  const selectedPlan = getPlan(query.plan);

  return <SignupForm selectedPlan={selectedPlan} />;
}
