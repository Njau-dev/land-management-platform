import {
  SubscriptionInterval,
  type PrismaClient,
} from "../../generated/prisma/client.js";

const plans = [
  {
    name: "Weekly",
    priceKes: 200,
    interval: SubscriptionInterval.WEEK,
    intervalCount: 1,
    isActive: true,
  },
  {
    name: "Monthly",
    priceKes: 600,
    interval: SubscriptionInterval.MONTH,
    intervalCount: 1,
    isActive: true,
  },
  {
    name: "Annual",
    priceKes: 6_000,
    interval: SubscriptionInterval.YEAR,
    intervalCount: 1,
    isActive: true,
  },
] as const;

export async function seedPlans(prisma: PrismaClient): Promise<void> {
  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      create: plan,
      update: {
        priceKes: plan.priceKes,
        interval: plan.interval,
        intervalCount: plan.intervalCount,
        isActive: plan.isActive,
      },
    });
  }
}
