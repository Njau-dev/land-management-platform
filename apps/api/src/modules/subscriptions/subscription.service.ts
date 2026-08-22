import {
  SubscriptionStatus,
  type Prisma,
} from "../../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { addPlanDuration } from "./subscription.dates.js";

const subscriptionInclude = {
  plan: {
    select: {
      id: true,
      name: true,
      priceKes: true,
      interval: true,
      intervalCount: true,
    },
  },
} as const;

export async function activateSubscriptionForPayment(
  transaction: Prisma.TransactionClient,
  payment: {
    id: string;
    userId: string;
    planId: string;
    subscriptionId: string | null;
    plan: {
      interval: Parameters<typeof addPlanDuration>[1];
      intervalCount: number;
    };
  },
  now: Date,
) {
  if (payment.subscriptionId) {
    return transaction.subscription.findUniqueOrThrow({
      where: { id: payment.subscriptionId },
      include: subscriptionInclude,
    });
  }

  const latestEntitlement = await transaction.subscription.findFirst({
    where: {
      userId: payment.userId,
      status: SubscriptionStatus.ACTIVE,
      endsAt: { gt: now },
    },
    orderBy: { endsAt: "desc" },
    select: { endsAt: true },
  });
  const startsAt = latestEntitlement?.endsAt ?? now;
  const endsAt = addPlanDuration(
    startsAt,
    payment.plan.interval,
    payment.plan.intervalCount,
  );

  return transaction.subscription.create({
    data: {
      userId: payment.userId,
      planId: payment.planId,
      startsAt,
      endsAt,
      status: SubscriptionStatus.ACTIVE,
    },
    include: subscriptionInclude,
  });
}

export async function getCurrentSubscription(userId: string, now = new Date()) {
  const current = await prisma.subscription.findFirst({
    where: {
      userId,
      status: SubscriptionStatus.ACTIVE,
      startsAt: { lte: now },
      endsAt: { gt: now },
    },
    include: subscriptionInclude,
    orderBy: { endsAt: "desc" },
  });

  if (!current) {
    return null;
  }

  const paidThrough = await prisma.subscription.findFirst({
    where: {
      userId,
      status: SubscriptionStatus.ACTIVE,
      endsAt: { gt: now },
    },
    orderBy: { endsAt: "desc" },
    select: { endsAt: true },
  });

  return {
    ...current,
    accessEndsAt: paidThrough?.endsAt ?? current.endsAt,
    remainingSeconds: Math.max(
      0,
      Math.floor(
        ((paidThrough?.endsAt ?? current.endsAt).getTime() - now.getTime()) /
          1_000,
      ),
    ),
  };
}
