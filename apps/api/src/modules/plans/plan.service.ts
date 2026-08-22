import { prisma } from "../../lib/prisma.js";

const publicPlanSelect = {
  id: true,
  name: true,
  priceKes: true,
  interval: true,
  intervalCount: true,
} as const;

export async function listActivePlans() {
  return prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    select: publicPlanSelect,
    orderBy: [{ priceKes: "asc" }, { name: "asc" }],
  });
}
