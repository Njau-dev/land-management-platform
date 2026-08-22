import request from "supertest";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import {
  AvailabilityStatus,
  LoanLienStatus,
  LoanLienType,
  SubscriptionInterval,
  SubscriptionStatus,
  UserRole,
  UserStatus,
  ZoneType,
  type SubscriptionPlan,
  type TitleDeed,
  type User,
} from "../generated/prisma/client.js";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { signAccessToken } from "../src/modules/auth/auth.tokens.js";

const runId = `${Date.now().toString(36)}-${process.pid}`;
const createdUserIds: string[] = [];
const createdTitleDeedIds: string[] = [];
let plan: SubscriptionPlan;
let subscriber: User;
let unsubscribedUser: User;
let expiredUser: User;
let knownTitleDeed: TitleDeed;
let emptyRelationsTitleDeed: TitleDeed;

function tokenFor(user: User): string {
  return signAccessToken(user);
}

function searchPath(titleDeedNumber: string, suffix = ""): string {
  return `/api/v1/land/search/${encodeURIComponent(titleDeedNumber)}${suffix}`;
}

async function createUser(label: string): Promise<User> {
  const user = await prisma.user.create({
    data: {
      name: `Land search ${label}`,
      email: `land-search-${runId}-${label}@example.test`,
      passwordHash: "not-used-by-land-search-tests",
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    },
  });
  createdUserIds.push(user.id);
  return user;
}

beforeAll(async () => {
  plan = await prisma.subscriptionPlan.create({
    data: {
      name: `Land Search Plan ${runId}`,
      priceKes: 321,
      interval: SubscriptionInterval.MONTH,
      intervalCount: 1,
      isActive: true,
    },
  });

  [subscriber, unsubscribedUser, expiredUser] = await Promise.all([
    createUser("subscriber"),
    createUser("unsubscribed"),
    createUser("expired"),
  ]);

  await Promise.all([
    prisma.subscription.create({
      data: {
        userId: subscriber.id,
        planId: plan.id,
        startsAt: new Date(Date.now() - 60_000),
        endsAt: new Date(Date.now() + 86_400_000),
        status: SubscriptionStatus.ACTIVE,
      },
    }),
    prisma.subscription.create({
      data: {
        userId: expiredUser.id,
        planId: plan.id,
        startsAt: new Date(Date.now() - 172_800_000),
        endsAt: new Date(Date.now() - 86_400_000),
        status: SubscriptionStatus.ACTIVE,
      },
    }),
  ]);

  knownTitleDeed = await prisma.titleDeed.create({
    data: {
      titleDeedNumber: `TEST/LAND/${runId}/001`,
      ownerName: "Test Current Owner",
      location: "Test Location, Kenya",
      size: "0.1250",
      availabilityStatus: AvailabilityStatus.UNDER_TRANSACTION,
      landRate: "8500000.25",
      zoningInfo: {
        create: {
          zoneType: ZoneType.MIXED_USE,
          notes: "Test zoning notes",
          restrictions: "Test zoning restriction",
        },
      },
      loansLiens: {
        create: [
          {
            type: LoanLienType.LOAN,
            lender: "Test Bank",
            amount: "450000.75",
            status: LoanLienStatus.ACTIVE,
            dueDate: new Date("2028-06-30T00:00:00.000Z"),
            notes: "Test loan",
          },
          {
            type: LoanLienType.LIEN,
            lender: "Test County",
            amount: "25000.00",
            status: LoanLienStatus.OVERDUE,
            dueDate: new Date("2025-06-30T00:00:00.000Z"),
            notes: null,
          },
        ],
      },
      ownershipHistory: {
        create: [
          {
            ownerName: "Older Owner",
            transferDate: new Date("2012-01-10T00:00:00.000Z"),
            notes: null,
          },
          {
            ownerName: "Newer Owner",
            transferDate: new Date("2020-05-20T00:00:00.000Z"),
            notes: "Most recent historical owner",
          },
        ],
      },
    },
  });
  createdTitleDeedIds.push(knownTitleDeed.id);

  emptyRelationsTitleDeed = await prisma.titleDeed.create({
    data: {
      titleDeedNumber: `TEST/LAND/${runId}/EMPTY`,
      ownerName: "No History Owner",
      location: "Empty Relations Location",
      size: "1.0000",
      availabilityStatus: AvailabilityStatus.AVAILABLE,
      landRate: "1000000.00",
    },
  });
  createdTitleDeedIds.push(emptyRelationsTitleDeed.id);
});

afterAll(async () => {
  await prisma.searchLog.deleteMany({
    where: { userId: { in: createdUserIds } },
  });
  await prisma.loanLien.deleteMany({
    where: { titleDeedId: { in: createdTitleDeedIds } },
  });
  await prisma.ownershipHistory.deleteMany({
    where: { titleDeedId: { in: createdTitleDeedIds } },
  });
  await prisma.zoningInfo.deleteMany({
    where: { titleDeedId: { in: createdTitleDeedIds } },
  });
  await prisma.titleDeed.deleteMany({
    where: { id: { in: createdTitleDeedIds } },
  });
  await prisma.subscription.deleteMany({
    where: { userId: { in: createdUserIds } },
  });
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  await prisma.subscriptionPlan.delete({ where: { id: plan.id } });
  await prisma.$disconnect();
});

describe("land search authorization", () => {
  test("rejects unauthenticated searches", async () => {
    const response = await request(app).get(
      searchPath(knownTitleDeed.titleDeedNumber),
    );
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  test("rejects authenticated users without a subscription", async () => {
    const response = await request(app)
      .get(searchPath(knownTitleDeed.titleDeedNumber))
      .set("Authorization", `Bearer ${tokenFor(unsubscribedUser)}`);
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("SUBSCRIPTION_REQUIRED");
  });

  test("allows active subscribers", async () => {
    const response = await request(app)
      .get(searchPath(knownTitleDeed.titleDeedNumber))
      .set("Authorization", `Bearer ${tokenFor(subscriber)}`);
    expect(response.status).toBe(200);
  });

  test("rejects expired subscribers", async () => {
    const response = await request(app)
      .get(searchPath(knownTitleDeed.titleDeedNumber))
      .set("Authorization", `Bearer ${tokenFor(expiredUser)}`);
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("SUBSCRIPTION_REQUIRED");
  });
});

describe("consolidated land search", () => {
  test("returns availability, zoning, encumbrances, history, and exact decimal strings", async () => {
    const response = await request(app)
      .get(searchPath(`  ${knownTitleDeed.titleDeedNumber}  `))
      .set("Authorization", `Bearer ${tokenFor(subscriber)}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      titleDeed: {
        titleDeedNumber: knownTitleDeed.titleDeedNumber,
        ownerName: "Test Current Owner",
        location: "Test Location, Kenya",
        size: "0.1250",
        availabilityStatus: AvailabilityStatus.UNDER_TRANSACTION,
        landRate: "8500000.25",
      },
      zoning: {
        zoneType: ZoneType.MIXED_USE,
        notes: "Test zoning notes",
        restrictions: "Test zoning restriction",
      },
    });
    expect(response.body.loansLiens).toHaveLength(2);
    expect(response.body.loansLiens).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ amount: "450000.75" }),
        expect.objectContaining({ status: LoanLienStatus.OVERDUE }),
      ]),
    );
    expect(response.body.ownershipHistory.map((item: { ownerName: string }) => item.ownerName)).toEqual([
      "Newer Owner",
      "Older Owner",
    ]);
    expect(new Date(response.body.searchedAt).toString()).not.toBe("Invalid Date");
  });

  test("returns neutral empty collections when history, zoning, and loans are absent", async () => {
    const response = await request(app)
      .get(searchPath(emptyRelationsTitleDeed.titleDeedNumber))
      .set("Authorization", `Bearer ${tokenFor(subscriber)}`);

    expect(response.status).toBe(200);
    expect(response.body.zoning).toBeNull();
    expect(response.body.loansLiens).toEqual([]);
    expect(response.body.ownershipHistory).toEqual([]);
  });

  test("logs found searches with the matching title deed", async () => {
    const searchedTitleNumber = knownTitleDeed.titleDeedNumber;
    const before = await prisma.searchLog.count({
      where: { userId: subscriber.id, searchedTitleNumber },
    });

    await request(app)
      .get(searchPath(searchedTitleNumber))
      .set("Authorization", `Bearer ${tokenFor(subscriber)}`)
      .expect(200);

    const log = await prisma.searchLog.findFirst({
      where: { userId: subscriber.id, searchedTitleNumber },
      orderBy: { searchedAt: "desc" },
    });
    const after = await prisma.searchLog.count({
      where: { userId: subscriber.id, searchedTitleNumber },
    });
    expect(after).toBe(before + 1);
    expect(log?.titleDeedId).toBe(knownTitleDeed.id);
  });

  test("returns a stable 404 and logs a not-found search", async () => {
    const searchedTitleNumber = `TEST/LAND/${runId}/MISSING`;
    const response = await request(app)
      .get(searchPath(searchedTitleNumber))
      .set("Authorization", `Bearer ${tokenFor(subscriber)}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("TITLE_DEED_NOT_FOUND");
    expect(
      await prisma.searchLog.findFirst({
        where: { userId: subscriber.id, searchedTitleNumber },
      }),
    ).toMatchObject({ titleDeedId: null });
  });

  test("does not log an invalid blank title number", async () => {
    const before = await prisma.searchLog.count({
      where: { userId: subscriber.id },
    });
    const response = await request(app)
      .get(searchPath(" "))
      .set("Authorization", `Bearer ${tokenFor(subscriber)}`);
    const after = await prisma.searchLog.count({
      where: { userId: subscriber.id },
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(after).toBe(before);
  });
});

describe("land PDF reports", () => {
  test("allows a subscriber to download non-empty PDF bytes with a safe filename", async () => {
    const response = await request(app)
      .get(searchPath(knownTitleDeed.titleDeedNumber, "/report"))
      .set("Authorization", `Bearer ${tokenFor(subscriber)}`)
      .buffer(true);

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/^application\/pdf/);
    expect(response.headers["content-disposition"]).toMatch(
      /^attachment; filename="land-search-[A-Za-z0-9-]+\.pdf"$/,
    );
    expect(response.headers["x-report-reference"]).toMatch(
      /^LMP-\d{8}-[A-F0-9]{8}$/,
    );
    expect(Buffer.isBuffer(response.body)).toBe(true);
    expect((response.body as Buffer).subarray(0, 5).toString()).toBe("%PDF-");
    expect((response.body as Buffer).length).toBeGreaterThan(1_000);
  });

  test("does not count a report download as another normal search", async () => {
    const before = await prisma.searchLog.count({
      where: { userId: subscriber.id },
    });
    await request(app)
      .get(searchPath(knownTitleDeed.titleDeedNumber, "/report"))
      .set("Authorization", `Bearer ${tokenFor(subscriber)}`)
      .expect(200);
    const after = await prisma.searchLog.count({
      where: { userId: subscriber.id },
    });

    expect(after).toBe(before);
  });

  test("rejects report access without a current subscription", async () => {
    const unsubscribed = await request(app)
      .get(searchPath(knownTitleDeed.titleDeedNumber, "/report"))
      .set("Authorization", `Bearer ${tokenFor(unsubscribedUser)}`);
    const expired = await request(app)
      .get(searchPath(knownTitleDeed.titleDeedNumber, "/report"))
      .set("Authorization", `Bearer ${tokenFor(expiredUser)}`);

    expect(unsubscribed.status).toBe(403);
    expect(expired.status).toBe(403);
    expect(expired.body.error.code).toBe("SUBSCRIPTION_REQUIRED");
  });

  test("returns TITLE_DEED_NOT_FOUND for an unknown report title", async () => {
    const response = await request(app)
      .get(searchPath(`TEST/LAND/${runId}/NO-REPORT`, "/report"))
      .set("Authorization", `Bearer ${tokenFor(subscriber)}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("TITLE_DEED_NOT_FOUND");
  });
});
