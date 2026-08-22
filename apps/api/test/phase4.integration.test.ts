import express from "express";
import request from "supertest";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";

import {
  PaymentProvider,
  PaymentStatus,
  SubscriptionInterval,
  SubscriptionStatus,
  UserRole,
  UserStatus,
  type SubscriptionPlan,
  type User,
} from "../generated/prisma/client.js";
import { app } from "../src/app.js";
import { env } from "../src/config/env.js";
import { prisma } from "../src/lib/prisma.js";
import { errorHandler } from "../src/middleware/error-handler.js";
import { requireActiveUser } from "../src/middleware/require-active-user.js";
import { requireAuth } from "../src/middleware/require-auth.js";
import { requireSubscription } from "../src/middleware/require-subscription.js";
import { signAccessToken } from "../src/modules/auth/auth.tokens.js";
import { clearMpesaTokenCache } from "../src/modules/payments/mpesa.client.js";
import { completeMpesaPayment } from "../src/modules/payments/payment.confirmation.js";
import { simulateSuccessfulMpesaCallback } from "../src/modules/payments/payment.simulator.js";
import { normalizeKenyanPhoneNumber } from "../src/modules/payments/phone-number.js";
import { addPlanDuration } from "../src/modules/subscriptions/subscription.dates.js";

const runId = `${Date.now().toString(36)}-${process.pid}`;
const createdUserIds: string[] = [];
const createdPlanIds: string[] = [];
const fetchMock = vi.fn<typeof fetch>();
let checkoutSequence = 0;
let weeklyPlan: SubscriptionPlan;
let monthlyPlan: SubscriptionPlan;
let annualPlan: SubscriptionPlan;
let inactivePlan: SubscriptionPlan;
let primaryUser: User;
let otherUser: User;

function tokenFor(user: User): string {
  return signAccessToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  });
}

async function createTestUser(label: string): Promise<User> {
  const user = await prisma.user.create({
    data: {
      name: `Phase 4 ${label}`,
      email: `phase4-${runId}-${label}@example.test`,
      passwordHash: "not-used-by-phase-4-tests",
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    },
  });
  createdUserIds.push(user.id);
  return user;
}

async function createPlan(
  label: string,
  priceKes: number,
  interval: SubscriptionInterval,
  isActive = true,
): Promise<SubscriptionPlan> {
  const plan = await prisma.subscriptionPlan.create({
    data: {
      name: `Phase4 ${runId} ${label}`,
      priceKes,
      interval,
      intervalCount: 1,
      isActive,
    },
  });
  createdPlanIds.push(plan.id);
  return plan;
}

async function createPendingPayment(
  userId: string,
  plan: SubscriptionPlan,
) {
  checkoutSequence += 1;
  return prisma.payment.create({
    data: {
      userId,
      planId: plan.id,
      provider: PaymentProvider.MPESA,
      amountKes: plan.priceKes,
      phoneNumber: "254712345678",
      merchantRequestId: `merchant-${runId}-${checkoutSequence}`,
      checkoutRequestId: `checkout-${runId}-${checkoutSequence}`,
      status: PaymentStatus.PENDING,
    },
  });
}

function confirmationFor(
  payment: Awaited<ReturnType<typeof createPendingPayment>>,
) {
  return {
    checkoutRequestId: payment.checkoutRequestId!,
    merchantRequestId: payment.merchantRequestId!,
    resultCode: 0,
    resultDescription: "Processed successfully",
    mpesaReceiptNumber: `TEST-${payment.id.toUpperCase()}`,
    amountKes: payment.amountKes,
    phoneNumber: payment.phoneNumber,
    providerMetadata: { source: "test-confirmation" },
  };
}

function mockAcceptedDaraja(checkoutId: string): void {
  fetchMock
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({ access_token: "sandbox-access-token", expires_in: 3600 }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          MerchantRequestID: `merchant-${checkoutId}`,
          CheckoutRequestID: checkoutId,
          ResponseCode: "0",
          ResponseDescription: "Success. Request accepted for processing",
          CustomerMessage: "Success. Request accepted for processing",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
}

function callbackBody(
  payment: Awaited<ReturnType<typeof createPendingPayment>>,
  resultCode = 0,
) {
  return {
    Body: {
      stkCallback: {
        MerchantRequestID: payment.merchantRequestId,
        CheckoutRequestID: payment.checkoutRequestId,
        ResultCode: resultCode,
        ResultDesc: resultCode === 0 ? "Processed successfully" : "Cancelled",
        ...(resultCode === 0
          ? {
              CallbackMetadata: {
                Item: [
                  { Name: "Amount", Value: payment.amountKes },
                  {
                    Name: "MpesaReceiptNumber",
                    Value: `CALLBACK-${payment.id.toUpperCase()}`,
                  },
                  { Name: "TransactionDate", Value: 20260822120000 },
                  { Name: "PhoneNumber", Value: Number(payment.phoneNumber) },
                ],
              },
            }
          : {}),
      },
    },
  };
}

beforeAll(async () => {
  vi.stubGlobal("fetch", fetchMock);
  [weeklyPlan, monthlyPlan, annualPlan, inactivePlan] = await Promise.all([
    createPlan("Weekly", 200, SubscriptionInterval.WEEK),
    createPlan("Monthly", 600, SubscriptionInterval.MONTH),
    createPlan("Annual", 6_000, SubscriptionInterval.YEAR),
    createPlan("Inactive", 999, SubscriptionInterval.MONTH, false),
  ]);
  [primaryUser, otherUser] = await Promise.all([
    createTestUser("primary"),
    createTestUser("other"),
  ]);
});

beforeEach(() => {
  fetchMock.mockReset();
  clearMpesaTokenCache();
  env.MPESA_ENVIRONMENT = "sandbox";
  env.MPESA_SIMULATE_CALLBACK = true;
});

afterAll(async () => {
  vi.unstubAllGlobals();
  await prisma.payment.deleteMany({ where: { userId: { in: createdUserIds } } });
  await prisma.subscription.deleteMany({
    where: { userId: { in: createdUserIds } },
  });
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  await prisma.subscriptionPlan.deleteMany({
    where: { id: { in: createdPlanIds } },
  });
  await prisma.$disconnect();
});

describe("plans and phone normalization", () => {
  test("lists only active plans", async () => {
    const response = await request(app).get("/api/v1/plans");

    expect(response.status).toBe(200);
    expect(response.body.plans).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: weeklyPlan.id, priceKes: 200 }),
        expect.objectContaining({ id: monthlyPlan.id, priceKes: 600 }),
        expect.objectContaining({ id: annualPlan.id, priceKes: 6_000 }),
      ]),
    );
    expect(
      response.body.plans.some(
        (plan: { id: string }) => plan.id === inactivePlan.id,
      ),
    ).toBe(false);
  });

  test.each([
    "0712345678",
    "712345678",
    "254712345678",
    "+254712345678",
  ])("normalizes %s", (phone) => {
    expect(normalizeKenyanPhoneNumber(phone)).toBe("254712345678");
  });

  test.each([
    "",
    "12345",
    "255712345678",
    "254612345678",
    "2540712345678",
  ])(
    "rejects invalid phone %s",
    (phone) => {
      expect(() => normalizeKenyanPhoneNumber(phone)).toThrow(
        expect.objectContaining({ code: "INVALID_PHONE_NUMBER" }),
      );
    },
  );
});

describe("calendar-aware durations", () => {
  test("adds a full week", () => {
    const start = new Date("2026-08-22T10:00:00.000Z");
    expect(addPlanDuration(start, SubscriptionInterval.WEEK, 1)).toEqual(
      new Date("2026-08-29T10:00:00.000Z"),
    );
  });

  test("clamps a calendar month at month end", () => {
    const start = new Date("2024-01-31T10:00:00.000Z");
    expect(addPlanDuration(start, SubscriptionInterval.MONTH, 1)).toEqual(
      new Date("2024-02-29T10:00:00.000Z"),
    );
  });

  test("clamps a calendar year from leap day", () => {
    const start = new Date("2024-02-29T10:00:00.000Z");
    expect(addPlanDuration(start, SubscriptionInterval.YEAR, 1)).toEqual(
      new Date("2025-02-28T10:00:00.000Z"),
    );
  });
});

describe("payment initiation and simulator", () => {
  test("uses the database amount, sends a real mocked STK request, and simulates confirmation", async () => {
    const checkoutId = `ws_CO_${runId}_accepted`;
    mockAcceptedDaraja(checkoutId);

    const response = await request(app)
      .post("/api/v1/payments/mpesa/initiate")
      .set("Authorization", `Bearer ${tokenFor(primaryUser)}`)
      .send({ planId: monthlyPlan.id, phoneNumber: "0712345678" });

    expect(response.status).toBe(201);
    expect(response.body.payment).toMatchObject({
      amountKes: monthlyPlan.priceKes,
      phoneNumber: "254712345678",
      status: PaymentStatus.SUCCESSFUL,
      plan: { id: monthlyPlan.id },
      subscription: { status: SubscriptionStatus.ACTIVE },
    });
    expect(response.body.payment.mpesaReceiptNumber).toMatch(/^SANDBOX-/);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const stkBody = JSON.parse(
      String(fetchMock.mock.calls[1]?.[1]?.body),
    ) as Record<string, unknown>;
    expect(stkBody["Amount"]).toBe(monthlyPlan.priceKes);
    expect(stkBody["PhoneNumber"]).toBe("254712345678");
  });

  test("requires the authenticated user and rejects client-controlled fields", async () => {
    const unauthenticated = await request(app)
      .post("/api/v1/payments/mpesa/initiate")
      .send({ planId: weeklyPlan.id, phoneNumber: "0712345678" });
    const extraUserId = await request(app)
      .post("/api/v1/payments/mpesa/initiate")
      .set("Authorization", `Bearer ${tokenFor(primaryUser)}`)
      .send({
        planId: weeklyPlan.id,
        phoneNumber: "0712345678",
        userId: otherUser.id,
        amountKes: 1,
      });

    expect(unauthenticated.status).toBe(401);
    expect(extraUserId.status).toBe(400);
    expect(extraUserId.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("rejects missing and inactive plans before contacting Daraja", async () => {
    const invalid = await request(app)
      .post("/api/v1/payments/mpesa/initiate")
      .set("Authorization", `Bearer ${tokenFor(primaryUser)}`)
      .send({ planId: "missing-plan", phoneNumber: "0712345678" });
    const inactive = await request(app)
      .post("/api/v1/payments/mpesa/initiate")
      .set("Authorization", `Bearer ${tokenFor(primaryUser)}`)
      .send({ planId: inactivePlan.id, phoneNumber: "0712345678" });

    expect(invalid.body.error.code).toBe("INVALID_PLAN");
    expect(inactive.body.error.code).toBe("INACTIVE_PLAN");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("records a safe failure when Daraja OAuth is rejected", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          errorCode: "invalid_client",
          errorMessage: "Invalid consumer credentials",
        }),
        { status: 401, headers: { "content-type": "application/json" } },
      ),
    );

    const response = await request(app)
      .post("/api/v1/payments/mpesa/initiate")
      .set("Authorization", `Bearer ${tokenFor(primaryUser)}`)
      .send({ planId: weeklyPlan.id, phoneNumber: "0712345678" });

    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe("MPESA_AUTH_FAILED");
    expect(
      (
        await prisma.payment.findFirst({
          where: { userId: primaryUser.id, planId: weeklyPlan.id },
          orderBy: { createdAt: "desc" },
        })
      )?.status,
    ).toBe(PaymentStatus.FAILED);
  });

  test("records a safe failure when Daraja rejects STK initiation", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: "sandbox-access-token", expires_in: 3600 }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            errorCode: "500.001.1001",
            errorMessage: "Unable to process request",
          }),
          { status: 400, headers: { "content-type": "application/json" } },
        ),
      );

    const response = await request(app)
      .post("/api/v1/payments/mpesa/initiate")
      .set("Authorization", `Bearer ${tokenFor(primaryUser)}`)
      .send({ planId: annualPlan.id, phoneNumber: "0712345678" });

    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe("MPESA_STK_INITIATION_FAILED");
    expect(
      (
        await prisma.payment.findFirst({
          where: { userId: primaryUser.id, planId: annualPlan.id },
          orderBy: { createdAt: "desc" },
        })
      )?.status,
    ).toBe(PaymentStatus.FAILED);
  });

  test("cannot run the simulator outside sandbox", async () => {
    const payment = await createPendingPayment(primaryUser.id, weeklyPlan);
    env.MPESA_ENVIRONMENT = "production";

    await expect(simulateSuccessfulMpesaCallback(payment.id)).rejects.toMatchObject({
      code: "MPESA_SIMULATOR_DISABLED",
    });
  });

  test("duplicate simulation is idempotent", async () => {
    const user = await createTestUser("duplicate-simulator");
    const payment = await createPendingPayment(user.id, weeklyPlan);

    await simulateSuccessfulMpesaCallback(payment.id);
    await simulateSuccessfulMpesaCallback(payment.id);

    expect(
      await prisma.subscription.count({ where: { userId: user.id } }),
    ).toBe(1);
  });
});

describe("subscription activation", () => {
  test("creates a new subscription and cannot activate one payment twice", async () => {
    const user = await createTestUser("new-subscription");
    const payment = await createPendingPayment(user.id, weeklyPlan);
    const first = await completeMpesaPayment(confirmationFor(payment));
    const second = await completeMpesaPayment(confirmationFor(payment));

    expect(first?.subscriptionId).toEqual(expect.any(String));
    expect(second?.subscriptionId).toBe(first?.subscriptionId);
    expect(
      await prisma.subscription.count({ where: { userId: user.id } }),
    ).toBe(1);
  });

  test("an early renewal begins at the latest paid-through date", async () => {
    const user = await createTestUser("early-renewal");
    const existingEndsAt = new Date(Date.now() + 10 * 24 * 60 * 60 * 1_000);
    await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: weeklyPlan.id,
        startsAt: new Date(),
        endsAt: existingEndsAt,
        status: SubscriptionStatus.ACTIVE,
      },
    });
    const payment = await createPendingPayment(user.id, monthlyPlan);
    const completed = await completeMpesaPayment(confirmationFor(payment));

    expect(completed?.subscription?.startsAt).toEqual(existingEndsAt);
    expect(completed?.subscription?.endsAt).toEqual(
      addPlanDuration(existingEndsAt, SubscriptionInterval.MONTH, 1),
    );
  });
});

describe("payment status, history, and current subscription", () => {
  test("lets only the owner inspect a payment", async () => {
    const payment = await createPendingPayment(primaryUser.id, weeklyPlan);
    const owner = await request(app)
      .get(`/api/v1/payments/${payment.id}/status`)
      .set("Authorization", `Bearer ${tokenFor(primaryUser)}`);
    const stranger = await request(app)
      .get(`/api/v1/payments/${payment.id}/status`)
      .set("Authorization", `Bearer ${tokenFor(otherUser)}`);

    expect(owner.status).toBe(200);
    expect(owner.body.payment.id).toBe(payment.id);
    expect(owner.body.payment).not.toHaveProperty("providerMetadata");
    expect(stranger.status).toBe(404);
    expect(stranger.body.error.code).toBe("PAYMENT_NOT_FOUND");
  });

  test("returns concise payment history", async () => {
    const response = await request(app)
      .get("/api/v1/payments")
      .set("Authorization", `Bearer ${tokenFor(primaryUser)}`);

    expect(response.status).toBe(200);
    expect(response.body.payments.length).toBeGreaterThan(0);
    expect(response.body.payments[0]).not.toHaveProperty("providerMetadata");
  });

  test("returns active entitlement without requiring a subscription to call", async () => {
    const active = await request(app)
      .get("/api/v1/subscription")
      .set("Authorization", `Bearer ${tokenFor(primaryUser)}`);
    const none = await request(app)
      .get("/api/v1/subscription")
      .set("Authorization", `Bearer ${tokenFor(otherUser)}`);

    expect(active.status).toBe(200);
    expect(active.body.activeSubscription).not.toBeNull();
    expect(active.body.activeSubscription.remainingSeconds).toBeGreaterThan(0);
    expect(none.status).toBe(200);
    expect(none.body.activeSubscription).toBeNull();
  });
});

describe("requireSubscription", () => {
  async function probe(user: User) {
    const protectedApp = express();
    protectedApp.get(
      "/protected",
      requireAuth,
      requireActiveUser,
      requireSubscription,
      (_request, response) => response.status(204).send(),
    );
    protectedApp.use(errorHandler);
    return request(protectedApp)
      .get("/protected")
      .set("Authorization", `Bearer ${tokenFor(user)}`);
  }

  test("allows a currently entitled user", async () => {
    expect((await probe(primaryUser)).status).toBe(204);
  });

  test("denies a user without entitlement", async () => {
    const response = await probe(otherUser);
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("SUBSCRIPTION_REQUIRED");
  });

  test("denies an expired entitlement", async () => {
    const user = await createTestUser("expired-subscription");
    await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: weeklyPlan.id,
        startsAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1_000),
        endsAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1_000),
        status: SubscriptionStatus.ACTIVE,
      },
    });

    const response = await probe(user);
    expect(response.status).toBe(403);
  });
});

describe("real callback parser and confirmation", () => {
  test("confirms success and treats a duplicate callback idempotently", async () => {
    const user = await createTestUser("callback-success");
    const payment = await createPendingPayment(user.id, annualPlan);
    const first = await request(app)
      .post("/api/v1/payments/mpesa/callback")
      .send(callbackBody(payment));
    const duplicate = await request(app)
      .post("/api/v1/payments/mpesa/callback")
      .send(callbackBody(payment));

    expect(first.status).toBe(200);
    expect(duplicate.status).toBe(200);
    expect(
      await prisma.subscription.count({ where: { userId: user.id } }),
    ).toBe(1);
    expect(
      (await prisma.payment.findUnique({ where: { id: payment.id } }))?.status,
    ).toBe(PaymentStatus.SUCCESSFUL);
  });

  test("records a failed callback without creating a subscription", async () => {
    const user = await createTestUser("callback-failure");
    const payment = await createPendingPayment(user.id, monthlyPlan);
    const response = await request(app)
      .post("/api/v1/payments/mpesa/callback")
      .send(callbackBody(payment, 1032));

    expect(response.status).toBe(200);
    expect(
      (await prisma.payment.findUnique({ where: { id: payment.id } }))?.status,
    ).toBe(PaymentStatus.FAILED);
    expect(
      await prisma.subscription.count({ where: { userId: user.id } }),
    ).toBe(0);
  });
});
