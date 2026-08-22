import request from "supertest";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import {
  AvailabilityStatus,
  LoanLienStatus,
  LoanLienType,
  PaymentProvider,
  PaymentStatus,
  SubscriptionInterval,
  SubscriptionStatus,
  UserRole,
  UserStatus,
  ZoneType,
  type SubscriptionPlan,
  type User,
} from "../generated/prisma/client.js";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { signAccessToken } from "../src/modules/auth/auth.tokens.js";

const runId = `${Date.now().toString(36)}-${process.pid}`;
const createdUserIds: string[] = [];
const createdTitleDeedIds: string[] = [];
let admin: User;
let normalUser: User;
let managedUser: User;
let expiredUser: User;
let plan: SubscriptionPlan;

function tokenFor(user: User): string {
  return signAccessToken(user);
}

function adminRequest(method: "get" | "post" | "patch" | "delete", path: string) {
  return request(app)[method](`/api/v1/admin${path}`).set(
    "Authorization",
    `Bearer ${tokenFor(admin)}`,
  );
}

async function createUser(label: string, role = UserRole.USER): Promise<User> {
  const user = await prisma.user.create({
    data: {
      name: `Admin Test ${label}`,
      email: `admin-${runId}-${label}@example.test`,
      passwordHash: `secret-hash-${label}`,
      role,
      status: UserStatus.ACTIVE,
    },
  });
  createdUserIds.push(user.id);
  return user;
}

beforeAll(async () => {
  [admin, normalUser, managedUser, expiredUser] = await Promise.all([
    createUser("administrator", UserRole.ADMIN),
    createUser("normal"),
    createUser("managed"),
    createUser("expired"),
  ]);
  plan = await prisma.subscriptionPlan.create({
    data: {
      name: `Admin Test Plan ${runId}`,
      priceKes: 750,
      interval: SubscriptionInterval.MONTH,
      intervalCount: 1,
      isActive: true,
    },
  });

  const now = Date.now();
  await Promise.all([
    prisma.subscription.create({
      data: {
        userId: managedUser.id,
        planId: plan.id,
        startsAt: new Date(now - 60_000),
        endsAt: new Date(now + 86_400_000),
        status: SubscriptionStatus.ACTIVE,
      },
    }),
    prisma.subscription.create({
      data: {
        userId: expiredUser.id,
        planId: plan.id,
        startsAt: new Date(now - 172_800_000),
        endsAt: new Date(now - 86_400_000),
        status: SubscriptionStatus.ACTIVE,
      },
    }),
    prisma.payment.create({
      data: {
        userId: managedUser.id,
        planId: plan.id,
        provider: PaymentProvider.MPESA,
        amountKes: 750,
        phoneNumber: "254712345678",
        status: PaymentStatus.SUCCESSFUL,
        mpesaReceiptNumber: `ADMIN-SUCCESS-${runId}`,
        completedAt: new Date(),
      },
    }),
    prisma.payment.create({
      data: {
        userId: normalUser.id,
        planId: plan.id,
        provider: PaymentProvider.MPESA,
        amountKes: 99_999,
        phoneNumber: "254712345678",
        status: PaymentStatus.FAILED,
      },
    }),
    prisma.searchLog.create({
      data: {
        userId: managedUser.id,
        titleDeedId: null,
        searchedTitleNumber: `ADMIN-ANALYTICS-${runId}`,
      },
    }),
    prisma.searchLog.create({
      data: {
        userId: normalUser.id,
        titleDeedId: null,
        searchedTitleNumber: `ADMIN-OLD-${runId}`,
        searchedAt: new Date("2020-01-01T00:00:00.000Z"),
      },
    }),
  ]);
});

afterAll(async () => {
  await prisma.searchLog.deleteMany({ where: { userId: { in: createdUserIds } } });
  await prisma.payment.deleteMany({ where: { userId: { in: createdUserIds } } });
  await prisma.subscription.deleteMany({ where: { userId: { in: createdUserIds } } });
  await prisma.loanLien.deleteMany({
    where: { titleDeedId: { in: createdTitleDeedIds } },
  });
  await prisma.ownershipHistory.deleteMany({
    where: { titleDeedId: { in: createdTitleDeedIds } },
  });
  await prisma.zoningInfo.deleteMany({
    where: { titleDeedId: { in: createdTitleDeedIds } },
  });
  await prisma.titleDeed.deleteMany({ where: { id: { in: createdTitleDeedIds } } });
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  await prisma.subscriptionPlan.delete({ where: { id: plan.id } });
  await prisma.$disconnect();
});

describe("admin authorization and analytics", () => {
  test("rejects unauthenticated and non-admin requests", async () => {
    const unauthenticated = await request(app).get("/api/v1/admin/analytics");
    const forbidden = await request(app)
      .get("/api/v1/admin/analytics")
      .set("Authorization", `Bearer ${tokenFor(normalUser)}`);

    expect(unauthenticated.status).toBe(401);
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.error.code).toBe("FORBIDDEN");
  });

  test("returns database-backed MVP metrics with time-based subscribers and successful revenue only", async () => {
    const now = new Date();
    const [expectedUsers, expectedActive, expectedPayments, expectedTitleDeeds] =
      await Promise.all([
        prisma.user.count({ where: { role: UserRole.USER } }),
        prisma.subscription.groupBy({
          by: ["userId"],
          where: {
            status: SubscriptionStatus.ACTIVE,
            startsAt: { lte: now },
            endsAt: { gt: now },
            user: { role: UserRole.USER },
          },
        }),
        prisma.payment.aggregate({
          where: { status: PaymentStatus.SUCCESSFUL },
          _count: { _all: true },
          _sum: { amountKes: true },
        }),
        prisma.titleDeed.count(),
      ]);
    const response = await adminRequest("get", "/analytics");

    expect(response.status).toBe(200);
    expect(response.body.analytics).toMatchObject({
      totalUsers: expectedUsers,
      activeSubscribers: expectedActive.length,
      usersWithoutActiveSubscription: expectedUsers - expectedActive.length,
      successfulPayments: expectedPayments._count._all,
      successfulPaymentRevenueKes: expectedPayments._sum.amountKes ?? 0,
      totalTitleDeeds: expectedTitleDeeds,
    });
    expect(response.body.analytics.searchesToday).toBeGreaterThanOrEqual(1);
    expect(response.body.analytics.searchesThisMonth).toBeGreaterThanOrEqual(
      response.body.analytics.searchesToday,
    );
  });
});

describe("admin user management", () => {
  test("lists and paginates safe user records", async () => {
    const response = await adminRequest("get", "/users?page=1&limit=2");

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.pagination).toMatchObject({ page: 1, limit: 2 });
    expect(response.body.items[0]).not.toHaveProperty("passwordHash");
    expect(response.body.items[0]).not.toHaveProperty("refreshTokens");
  });

  test("searches users by name or email and returns current subscription state", async () => {
    const response = await adminRequest(
      "get",
      `/users?search=${encodeURIComponent(managedUser.email)}&role=USER&status=ACTIVE`,
    );

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]).toMatchObject({
      id: managedUser.id,
      currentSubscription: { status: SubscriptionStatus.ACTIVE },
    });
  });

  test("views a user without exposing secret fields", async () => {
    const response = await adminRequest("get", `/users/${managedUser.id}`);
    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(managedUser.id);
    expect(response.body.user.recentPayments).toBeUndefined();
    expect(response.body.user.payments).toHaveLength(1);
    expect(JSON.stringify(response.body)).not.toContain("secret-hash");
  });

  test("suspends and reactivates a normal user", async () => {
    const suspended = await adminRequest("patch", `/users/${managedUser.id}`).send({
      status: UserStatus.SUSPENDED,
    });
    const blocked = await request(app)
      .get("/api/v1/subscription")
      .set("Authorization", `Bearer ${tokenFor(managedUser)}`);
    const active = await adminRequest("patch", `/users/${managedUser.id}`).send({
      status: UserStatus.ACTIVE,
    });

    expect(suspended.status).toBe(200);
    expect(suspended.body.user.status).toBe(UserStatus.SUSPENDED);
    expect(blocked.status).toBe(403);
    expect(blocked.body.error.code).toBe("ACCOUNT_SUSPENDED");
    expect(active.body.user.status).toBe(UserStatus.ACTIVE);
  });

  test("prevents administrator suspension", async () => {
    const response = await adminRequest("patch", `/users/${admin.id}`).send({
      status: UserStatus.SUSPENDED,
    });
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN_ADMIN_ACTION");
  });

  test("normal users cannot access user administration", async () => {
    const response = await request(app)
      .get("/api/v1/admin/users")
      .set("Authorization", `Bearer ${tokenFor(normalUser)}`);
    expect(response.status).toBe(403);
  });
});

describe("admin title deed CRUD", () => {
  let titleDeedId: string;

  test("creates, lists, views, and safely serializes a title deed", async () => {
    const input = {
      titleDeedNumber: `ADMIN/CRUD/${runId}/001`,
      ownerName: "Admin CRUD Owner",
      location: "Admin CRUD Location",
      size: "1.2500",
      availabilityStatus: AvailabilityStatus.AVAILABLE,
      landRate: "1234567.89",
    };
    const created = await adminRequest("post", "/title-deeds").send(input);
    titleDeedId = created.body.titleDeed.id;
    createdTitleDeedIds.push(titleDeedId);
    const listed = await adminRequest(
      "get",
      `/title-deeds?search=${encodeURIComponent(input.titleDeedNumber)}`,
    );
    const viewed = await adminRequest("get", `/title-deeds/${titleDeedId}`);

    expect(created.status).toBe(201);
    expect(created.body.titleDeed).toMatchObject({
      size: "1.2500",
      landRate: "1234567.89",
    });
    expect(listed.body.items).toHaveLength(1);
    expect(viewed.body.titleDeed.id).toBe(titleDeedId);
  });

  test("rejects duplicate title numbers", async () => {
    const record = await prisma.titleDeed.findUniqueOrThrow({
      where: { id: titleDeedId },
    });
    const response = await adminRequest("post", "/title-deeds").send({
      titleDeedNumber: record.titleDeedNumber,
      ownerName: "Duplicate",
      location: "Duplicate",
      size: "1.0000",
      availabilityStatus: AvailabilityStatus.SOLD,
      landRate: "10.00",
    });
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("DUPLICATE_TITLE_DEED_NUMBER");
  });

  test("updates and deletes a title deed without dependencies", async () => {
    const updated = await adminRequest("patch", `/title-deeds/${titleDeedId}`).send({
      ownerName: "Updated Admin Owner",
      availabilityStatus: AvailabilityStatus.UNDER_TRANSACTION,
    });
    const deleted = await adminRequest("delete", `/title-deeds/${titleDeedId}`);

    expect(updated.status).toBe(200);
    expect(updated.body.titleDeed.ownerName).toBe("Updated Admin Owner");
    expect(deleted.status).toBe(204);
  });

  test("rejects deletion while domain dependencies remain", async () => {
    const deed = await prisma.titleDeed.create({
      data: {
        titleDeedNumber: `ADMIN/DEPENDENCY/${runId}`,
        ownerName: "Dependent Owner",
        location: "Dependent Location",
        size: "2.0000",
        availabilityStatus: AvailabilityStatus.AVAILABLE,
        landRate: "2000.00",
        ownershipHistory: {
          create: {
            ownerName: "Prior Owner",
            transferDate: new Date("2020-01-01T00:00:00.000Z"),
          },
        },
      },
    });
    createdTitleDeedIds.push(deed.id);
    const response = await adminRequest("delete", `/title-deeds/${deed.id}`);
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("TITLE_DEED_HAS_DEPENDENCIES");
  });
});

describe("admin related land record CRUD", () => {
  let titleDeedId: string;

  beforeAll(async () => {
    const deed = await prisma.titleDeed.create({
      data: {
        titleDeedNumber: `ADMIN/RELATED/${runId}`,
        ownerName: "Related Records Owner",
        location: "Related Records Location",
        size: "3.0000",
        availabilityStatus: AvailabilityStatus.AVAILABLE,
        landRate: "3000.00",
      },
    });
    titleDeedId = deed.id;
    createdTitleDeedIds.push(deed.id);
  });

  test("creates, rejects duplicate, updates, and deletes zoning", async () => {
    const created = await adminRequest("post", "/zoning").send({
      titleDeedId,
      zoneType: ZoneType.RESIDENTIAL,
      notes: "Initial zoning",
      restrictions: null,
    });
    const zoningId = created.body.zoning.id;
    const duplicate = await adminRequest("post", "/zoning").send({
      titleDeedId,
      zoneType: ZoneType.COMMERCIAL,
    });
    const updated = await adminRequest("patch", `/zoning/${zoningId}`).send({
      zoneType: ZoneType.MIXED_USE,
    });
    const deleted = await adminRequest("delete", `/zoning/${zoningId}`);

    expect(created.status).toBe(201);
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe("DUPLICATE_ZONING");
    expect(updated.body.zoning.zoneType).toBe(ZoneType.MIXED_USE);
    expect(deleted.status).toBe(204);
  });

  test("creates, lists, updates, and deletes a loan with exact decimals", async () => {
    const created = await adminRequest("post", "/loans").send({
      titleDeedId,
      type: LoanLienType.LOAN,
      lender: "Admin Test Bank",
      amount: "450000.75",
      status: LoanLienStatus.ACTIVE,
      dueDate: "2028-06-30",
      notes: "Admin loan test",
    });
    const loanId = created.body.loan.id;
    const listed = await adminRequest("get", "/loans?status=ACTIVE&type=LOAN");
    const updated = await adminRequest("patch", `/loans/${loanId}`).send({
      amount: "400000.25",
      status: LoanLienStatus.CLEAR,
      dueDate: null,
    });
    const deleted = await adminRequest("delete", `/loans/${loanId}`);

    expect(created.status).toBe(201);
    expect(created.body.loan.amount).toBe("450000.75");
    expect(listed.body.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: loanId })]),
    );
    expect(updated.body.loan).toMatchObject({
      amount: "400000.25",
      status: LoanLienStatus.CLEAR,
      dueDate: null,
    });
    expect(deleted.status).toBe(204);
  });

  test("creates, lists, updates, and deletes ownership history", async () => {
    const created = await adminRequest("post", "/ownership-history").send({
      titleDeedId,
      ownerName: "Historical Owner",
      transferDate: "2018-04-10",
      notes: null,
    });
    const ownershipId = created.body.ownershipHistory.id;
    const listed = await adminRequest(
      "get",
      `/ownership-history?search=${encodeURIComponent("Historical Owner")}`,
    );
    const updated = await adminRequest(
      "patch",
      `/ownership-history/${ownershipId}`,
    ).send({ ownerName: "Updated Historical Owner" });
    const deleted = await adminRequest(
      "delete",
      `/ownership-history/${ownershipId}`,
    );

    expect(created.status).toBe(201);
    expect(listed.body.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: ownershipId })]),
    );
    expect(updated.body.ownershipHistory.ownerName).toBe(
      "Updated Historical Owner",
    );
    expect(deleted.status).toBe(204);
  });
});
