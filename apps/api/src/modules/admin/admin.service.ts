import {
  PaymentStatus,
  SubscriptionStatus,
  UserRole,
  UserStatus,
  type Prisma,
} from "../../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/app-error.js";
import type {
  CreateLoanInput,
  CreateOwnershipInput,
  CreateTitleDeedInput,
  CreateZoningInput,
  LoanListQuery,
  OwnershipListQuery,
  TitleDeedListQuery,
  UpdateLoanInput,
  UpdateOwnershipInput,
  UpdateTitleDeedInput,
  UpdateUserInput,
  UpdateZoningInput,
  UserListQuery,
  ZoningListQuery,
} from "./admin.schemas.js";
import { paginationMeta } from "./admin.types.js";

const planSelect = {
  id: true,
  name: true,
  priceKes: true,
  interval: true,
  intervalCount: true,
} as const;

const titleDeedSummarySelect = {
  id: true,
  titleDeedNumber: true,
  ownerName: true,
  location: true,
} as const;

function hasPrismaCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

function pageOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

function currentSubscriptionSummary(
  subscriptions: Array<{
    id: string;
    startsAt: Date;
    endsAt: Date;
    status: SubscriptionStatus;
    plan: {
      id: string;
      name: string;
      priceKes: number;
      interval: string;
      intervalCount: number;
    };
  }>,
  now: Date,
) {
  const current = subscriptions.find(
    (subscription) =>
      subscription.startsAt <= now && subscription.endsAt > now,
  );
  if (!current) return null;

  return {
    id: current.id,
    status: current.status,
    startsAt: current.startsAt,
    endsAt: current.endsAt,
    accessEndsAt: subscriptions[0]?.endsAt ?? current.endsAt,
    plan: current.plan,
  };
}

function nairobiPeriodStarts(now: Date): { today: Date; month: Date } {
  const offsetMs = 3 * 60 * 60 * 1_000;
  const local = new Date(now.getTime() + offsetMs);
  return {
    today: new Date(
      Date.UTC(
        local.getUTCFullYear(),
        local.getUTCMonth(),
        local.getUTCDate(),
      ) - offsetMs,
    ),
    month: new Date(
      Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) - offsetMs,
    ),
  };
}

export async function getAdminAnalytics(now = new Date()) {
  const { today, month } = nairobiPeriodStarts(now);
  const activeSubscriptionWhere = {
    status: SubscriptionStatus.ACTIVE,
    startsAt: { lte: now },
    endsAt: { gt: now },
    user: { role: UserRole.USER },
  } satisfies Prisma.SubscriptionWhereInput;

  const [
    totalUsers,
    activeGroups,
    paymentAggregate,
    searchesToday,
    searchesThisMonth,
    totalTitleDeeds,
  ] = await Promise.all([
    prisma.user.count({ where: { role: UserRole.USER } }),
    prisma.subscription.groupBy({
      by: ["userId"],
      where: activeSubscriptionWhere,
    }),
    prisma.payment.aggregate({
      where: { status: PaymentStatus.SUCCESSFUL },
      _count: { _all: true },
      _sum: { amountKes: true },
    }),
    prisma.searchLog.count({ where: { searchedAt: { gte: today } } }),
    prisma.searchLog.count({ where: { searchedAt: { gte: month } } }),
    prisma.titleDeed.count(),
  ]);

  const activeSubscribers = activeGroups.length;
  return {
    totalUsers,
    activeSubscribers,
    usersWithoutActiveSubscription: Math.max(0, totalUsers - activeSubscribers),
    successfulPayments: paymentAggregate._count._all,
    successfulPaymentRevenueKes: paymentAggregate._sum.amountKes ?? 0,
    searchesToday,
    searchesThisMonth,
    totalTitleDeeds,
  };
}

export async function listAdminUsers(query: UserListQuery) {
  const now = new Date();
  const where = {
    ...(query.role ? { role: query.role } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search } },
            { email: { contains: query.search } },
          ],
        }
      : {}),
  } satisfies Prisma.UserWhereInput;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        subscriptions: {
          where: {
            status: SubscriptionStatus.ACTIVE,
            endsAt: { gt: now },
          },
          select: {
            id: true,
            startsAt: true,
            endsAt: true,
            status: true,
            plan: { select: planSelect },
          },
          orderBy: { endsAt: "desc" },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: pageOffset(query.page, query.limit),
      take: query.limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items: users.map(({ subscriptions, ...user }) => ({
      ...user,
      currentSubscription: currentSubscriptionSummary(subscriptions, now),
    })),
    pagination: paginationMeta(query, total),
  };
}

export async function getAdminUser(userId: string) {
  const now = new Date();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      subscriptions: {
        where: { status: SubscriptionStatus.ACTIVE, endsAt: { gt: now } },
        select: {
          id: true,
          startsAt: true,
          endsAt: true,
          status: true,
          plan: { select: planSelect },
        },
        orderBy: { endsAt: "desc" },
      },
      payments: {
        select: {
          id: true,
          amountKes: true,
          status: true,
          createdAt: true,
          completedAt: true,
          plan: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "User not found");

  const { subscriptions, ...safeUser } = user;
  return {
    ...safeUser,
    currentSubscription: currentSubscriptionSummary(subscriptions, now),
  };
}

export async function updateAdminUserStatus(
  actorUserId: string,
  userId: string,
  input: UpdateUserInput,
) {
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!target) throw new AppError(404, "USER_NOT_FOUND", "User not found");
  if (target.role === UserRole.ADMIN || target.id === actorUserId) {
    throw new AppError(
      403,
      "FORBIDDEN_ADMIN_ACTION",
      "Administrator accounts cannot be suspended through this endpoint",
    );
  }

  return prisma.user.update({
    where: { id: userId },
    data: { status: input.status },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

const titleDeedListSelect = {
  ...titleDeedSummarySelect,
  size: true,
  availabilityStatus: true,
  landRate: true,
  createdAt: true,
  updatedAt: true,
  zoningInfo: { select: { id: true, zoneType: true } },
  _count: { select: { loansLiens: true, ownershipHistory: true } },
} satisfies Prisma.TitleDeedSelect;

function serializeTitleDeed<T extends { size: { toFixed(value: number): string }; landRate: { toFixed(value: number): string } }>(record: T) {
  return { ...record, size: record.size.toFixed(4), landRate: record.landRate.toFixed(2) };
}

export async function listAdminTitleDeeds(query: TitleDeedListQuery) {
  const where = {
    ...(query.availabilityStatus
      ? { availabilityStatus: query.availabilityStatus }
      : {}),
    ...(query.search
      ? {
          OR: [
            { titleDeedNumber: { contains: query.search } },
            { ownerName: { contains: query.search } },
            { location: { contains: query.search } },
          ],
        }
      : {}),
  } satisfies Prisma.TitleDeedWhereInput;
  const [items, total] = await Promise.all([
    prisma.titleDeed.findMany({
      where,
      select: titleDeedListSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: pageOffset(query.page, query.limit),
      take: query.limit,
    }),
    prisma.titleDeed.count({ where }),
  ]);
  return {
    items: items.map(serializeTitleDeed),
    pagination: paginationMeta(query, total),
  };
}

export async function getAdminTitleDeed(id: string) {
  const record = await prisma.titleDeed.findUnique({
    where: { id },
    select: {
      ...titleDeedListSelect,
      loansLiens: {
        select: { id: true, type: true, lender: true, status: true },
      },
      ownershipHistory: {
        select: { id: true, ownerName: true, transferDate: true },
        orderBy: { transferDate: "desc" },
      },
    },
  });
  if (!record) {
    throw new AppError(404, "TITLE_DEED_NOT_FOUND", "Title deed not found");
  }
  return serializeTitleDeed(record);
}

export async function createAdminTitleDeed(input: CreateTitleDeedInput) {
  try {
    const record = await prisma.titleDeed.create({
      data: input,
      select: titleDeedListSelect,
    });
    return serializeTitleDeed(record);
  } catch (error) {
    if (hasPrismaCode(error, "P2002")) {
      throw new AppError(
        409,
        "DUPLICATE_TITLE_DEED_NUMBER",
        "A title deed with that number already exists",
      );
    }
    throw error;
  }
}

export async function updateAdminTitleDeed(
  id: string,
  input: UpdateTitleDeedInput,
) {
  const data: Prisma.TitleDeedUncheckedUpdateInput = {};
  if (input.titleDeedNumber !== undefined) data.titleDeedNumber = input.titleDeedNumber;
  if (input.ownerName !== undefined) data.ownerName = input.ownerName;
  if (input.location !== undefined) data.location = input.location;
  if (input.size !== undefined) data.size = input.size;
  if (input.availabilityStatus !== undefined) {
    data.availabilityStatus = input.availabilityStatus;
  }
  if (input.landRate !== undefined) data.landRate = input.landRate;

  try {
    const record = await prisma.titleDeed.update({
      where: { id },
      data,
      select: titleDeedListSelect,
    });
    return serializeTitleDeed(record);
  } catch (error) {
    if (hasPrismaCode(error, "P2025")) {
      throw new AppError(404, "TITLE_DEED_NOT_FOUND", "Title deed not found");
    }
    if (hasPrismaCode(error, "P2002")) {
      throw new AppError(
        409,
        "DUPLICATE_TITLE_DEED_NUMBER",
        "A title deed with that number already exists",
      );
    }
    throw error;
  }
}

export async function deleteAdminTitleDeed(id: string): Promise<void> {
  const record = await prisma.titleDeed.findUnique({
    where: { id },
    select: {
      id: true,
      zoningInfo: { select: { id: true } },
      _count: { select: { loansLiens: true, ownershipHistory: true } },
    },
  });
  if (!record) {
    throw new AppError(404, "TITLE_DEED_NOT_FOUND", "Title deed not found");
  }
  if (
    record.zoningInfo ||
    record._count.loansLiens > 0 ||
    record._count.ownershipHistory > 0
  ) {
    throw new AppError(
      409,
      "TITLE_DEED_HAS_DEPENDENCIES",
      "Remove related zoning, loan/lien, and ownership records first",
    );
  }

  try {
    await prisma.titleDeed.delete({ where: { id } });
  } catch (error) {
    if (hasPrismaCode(error, "P2003")) {
      throw new AppError(
        409,
        "TITLE_DEED_HAS_DEPENDENCIES",
        "The title deed still has related records",
      );
    }
    throw error;
  }
}

const zoningSelect = {
  id: true,
  titleDeedId: true,
  zoneType: true,
  notes: true,
  restrictions: true,
  createdAt: true,
  updatedAt: true,
  titleDeed: { select: titleDeedSummarySelect },
} satisfies Prisma.ZoningInfoSelect;

export async function listAdminZoning(query: ZoningListQuery) {
  const where = {
    ...(query.zoneType ? { zoneType: query.zoneType } : {}),
    ...(query.titleDeedId ? { titleDeedId: query.titleDeedId } : {}),
    ...(query.search
      ? {
          OR: [
            { titleDeed: { titleDeedNumber: { contains: query.search } } },
            { titleDeed: { ownerName: { contains: query.search } } },
            { notes: { contains: query.search } },
          ],
        }
      : {}),
  } satisfies Prisma.ZoningInfoWhereInput;
  const [items, total] = await Promise.all([
    prisma.zoningInfo.findMany({
      where,
      select: zoningSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: pageOffset(query.page, query.limit),
      take: query.limit,
    }),
    prisma.zoningInfo.count({ where }),
  ]);
  return { items, pagination: paginationMeta(query, total) };
}

export async function getAdminZoning(id: string) {
  const record = await prisma.zoningInfo.findUnique({
    where: { id },
    select: zoningSelect,
  });
  if (!record) throw new AppError(404, "ZONING_NOT_FOUND", "Zoning record not found");
  return record;
}

async function zoningMutation<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (hasPrismaCode(error, "P2002")) {
      throw new AppError(
        409,
        "DUPLICATE_ZONING",
        "That title deed already has a zoning record",
      );
    }
    if (hasPrismaCode(error, "P2003")) {
      throw new AppError(400, "INVALID_RECORD", "The selected title deed does not exist");
    }
    if (hasPrismaCode(error, "P2025")) {
      throw new AppError(404, "ZONING_NOT_FOUND", "Zoning record not found");
    }
    throw error;
  }
}

export function createAdminZoning(input: CreateZoningInput) {
  return zoningMutation(() =>
    prisma.zoningInfo.create({
      data: {
        titleDeedId: input.titleDeedId,
        zoneType: input.zoneType,
        notes: input.notes ?? null,
        restrictions: input.restrictions ?? null,
      },
      select: zoningSelect,
    }),
  );
}

export function updateAdminZoning(id: string, input: UpdateZoningInput) {
  const data: Prisma.ZoningInfoUncheckedUpdateInput = {};
  if (input.titleDeedId !== undefined) data.titleDeedId = input.titleDeedId;
  if (input.zoneType !== undefined) data.zoneType = input.zoneType;
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.restrictions !== undefined) data.restrictions = input.restrictions;
  return zoningMutation(() =>
    prisma.zoningInfo.update({ where: { id }, data, select: zoningSelect }),
  );
}

export async function deleteAdminZoning(id: string): Promise<void> {
  await zoningMutation(() => prisma.zoningInfo.delete({ where: { id } }));
}

const loanSelect = {
  id: true,
  titleDeedId: true,
  type: true,
  lender: true,
  amount: true,
  status: true,
  dueDate: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  titleDeed: { select: titleDeedSummarySelect },
} satisfies Prisma.LoanLienSelect;

function serializeLoan<T extends { amount: { toFixed(value: number): string } }>(record: T) {
  return { ...record, amount: record.amount.toFixed(2) };
}

export async function listAdminLoans(query: LoanListQuery) {
  const where = {
    ...(query.type ? { type: query.type } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.titleDeedId ? { titleDeedId: query.titleDeedId } : {}),
    ...(query.search
      ? {
          OR: [
            { lender: { contains: query.search } },
            { titleDeed: { titleDeedNumber: { contains: query.search } } },
          ],
        }
      : {}),
  } satisfies Prisma.LoanLienWhereInput;
  const [items, total] = await Promise.all([
    prisma.loanLien.findMany({
      where,
      select: loanSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: pageOffset(query.page, query.limit),
      take: query.limit,
    }),
    prisma.loanLien.count({ where }),
  ]);
  return {
    items: items.map(serializeLoan),
    pagination: paginationMeta(query, total),
  };
}

export async function getAdminLoan(id: string) {
  const record = await prisma.loanLien.findUnique({
    where: { id },
    select: loanSelect,
  });
  if (!record) throw new AppError(404, "LOAN_LIEN_NOT_FOUND", "Loan or lien not found");
  return serializeLoan(record);
}

async function loanMutation<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (hasPrismaCode(error, "P2003")) {
      throw new AppError(400, "INVALID_RECORD", "The selected title deed does not exist");
    }
    if (hasPrismaCode(error, "P2025")) {
      throw new AppError(404, "LOAN_LIEN_NOT_FOUND", "Loan or lien not found");
    }
    throw error;
  }
}

export async function createAdminLoan(input: CreateLoanInput) {
  return serializeLoan(
    await loanMutation(() =>
      prisma.loanLien.create({
        data: {
          titleDeedId: input.titleDeedId,
          type: input.type,
          lender: input.lender,
          amount: input.amount,
          status: input.status,
          dueDate: input.dueDate ?? null,
          notes: input.notes ?? null,
        },
        select: loanSelect,
      }),
    ),
  );
}

export async function updateAdminLoan(id: string, input: UpdateLoanInput) {
  const data: Prisma.LoanLienUncheckedUpdateInput = {};
  if (input.titleDeedId !== undefined) data.titleDeedId = input.titleDeedId;
  if (input.type !== undefined) data.type = input.type;
  if (input.lender !== undefined) data.lender = input.lender;
  if (input.amount !== undefined) data.amount = input.amount;
  if (input.status !== undefined) data.status = input.status;
  if (input.dueDate !== undefined) data.dueDate = input.dueDate;
  if (input.notes !== undefined) data.notes = input.notes;
  return serializeLoan(
    await loanMutation(() =>
      prisma.loanLien.update({ where: { id }, data, select: loanSelect }),
    ),
  );
}

export async function deleteAdminLoan(id: string): Promise<void> {
  await loanMutation(() => prisma.loanLien.delete({ where: { id } }));
}

const ownershipSelect = {
  id: true,
  titleDeedId: true,
  ownerName: true,
  transferDate: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  titleDeed: { select: titleDeedSummarySelect },
} satisfies Prisma.OwnershipHistorySelect;

export async function listAdminOwnershipHistory(query: OwnershipListQuery) {
  const where = {
    ...(query.titleDeedId ? { titleDeedId: query.titleDeedId } : {}),
    ...(query.search
      ? {
          OR: [
            { ownerName: { contains: query.search } },
            { titleDeed: { titleDeedNumber: { contains: query.search } } },
          ],
        }
      : {}),
  } satisfies Prisma.OwnershipHistoryWhereInput;
  const [items, total] = await Promise.all([
    prisma.ownershipHistory.findMany({
      where,
      select: ownershipSelect,
      orderBy: [{ transferDate: "desc" }, { id: "desc" }],
      skip: pageOffset(query.page, query.limit),
      take: query.limit,
    }),
    prisma.ownershipHistory.count({ where }),
  ]);
  return { items, pagination: paginationMeta(query, total) };
}

export async function getAdminOwnershipHistory(id: string) {
  const record = await prisma.ownershipHistory.findUnique({
    where: { id },
    select: ownershipSelect,
  });
  if (!record) {
    throw new AppError(404, "OWNERSHIP_HISTORY_NOT_FOUND", "Ownership record not found");
  }
  return record;
}

async function ownershipMutation<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (hasPrismaCode(error, "P2003")) {
      throw new AppError(400, "INVALID_RECORD", "The selected title deed does not exist");
    }
    if (hasPrismaCode(error, "P2025")) {
      throw new AppError(
        404,
        "OWNERSHIP_HISTORY_NOT_FOUND",
        "Ownership record not found",
      );
    }
    throw error;
  }
}

export function createAdminOwnershipHistory(input: CreateOwnershipInput) {
  return ownershipMutation(() =>
    prisma.ownershipHistory.create({
      data: {
        titleDeedId: input.titleDeedId,
        ownerName: input.ownerName,
        transferDate: input.transferDate,
        notes: input.notes ?? null,
      },
      select: ownershipSelect,
    }),
  );
}

export function updateAdminOwnershipHistory(
  id: string,
  input: UpdateOwnershipInput,
) {
  const data: Prisma.OwnershipHistoryUncheckedUpdateInput = {};
  if (input.titleDeedId !== undefined) data.titleDeedId = input.titleDeedId;
  if (input.ownerName !== undefined) data.ownerName = input.ownerName;
  if (input.transferDate !== undefined) data.transferDate = input.transferDate;
  if (input.notes !== undefined) data.notes = input.notes;
  return ownershipMutation(() =>
    prisma.ownershipHistory.update({
      where: { id },
      data,
      select: ownershipSelect,
    }),
  );
}

export async function deleteAdminOwnershipHistory(id: string): Promise<void> {
  await ownershipMutation(() =>
    prisma.ownershipHistory.delete({ where: { id } }),
  );
}
