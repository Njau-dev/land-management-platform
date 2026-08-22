import express from "express";
import jwt from "jsonwebtoken";
import request, { type Response as SupertestResponse } from "supertest";
import { afterAll, describe, expect, test } from "vitest";
import { hash } from "bcryptjs";

import {
  UserRole,
  UserStatus,
} from "../generated/prisma/client.js";
import { app } from "../src/app.js";
import { env } from "../src/config/env.js";
import { prisma } from "../src/lib/prisma.js";
import { errorHandler } from "../src/middleware/error-handler.js";
import { requireActiveUser } from "../src/middleware/require-active-user.js";
import { requireAdmin } from "../src/middleware/require-admin.js";
import { requireAuth } from "../src/middleware/require-auth.js";
import { hashRefreshToken } from "../src/modules/auth/auth.tokens.js";

const runId = `${Date.now().toString(36)}-${process.pid}`;
const password = "A sufficiently long test passphrase 42";
const testEmails = new Set<string>();

function uniqueEmail(label: string): string {
  const email = `phase2-${runId}-${label}@example.test`.toLowerCase();
  testEmails.add(email);
  return email;
}

function refreshCookie(response: SupertestResponse): string {
  const header = response.headers["set-cookie"] as string[] | undefined;
  const cookie = header?.find((value) => value.startsWith("refresh_token="));

  if (!cookie) {
    throw new Error("Expected refresh cookie");
  }

  const [cookiePair] = cookie.split(";");

  if (!cookiePair) {
    throw new Error("Expected refresh cookie value");
  }

  return cookiePair;
}

async function signupUser(label: string) {
  const email = uniqueEmail(label);
  const response = await request(app).post("/api/v1/auth/signup").send({
    name: `Test User ${label}`,
    email,
    password,
  });

  expect(response.status).toBe(201);
  return { email, response };
}

async function createUser(
  label: string,
  role: UserRole,
  status: UserStatus = UserStatus.ACTIVE,
) {
  const email = uniqueEmail(label);
  const user = await prisma.user.create({
    data: {
      name: `Test ${role} ${label}`,
      email,
      passwordHash: await hash(password, 12),
      role,
      status,
    },
  });

  return { email, user };
}

afterAll(async () => {
  await prisma.user.deleteMany({
    where: { email: { in: [...testEmails] } },
  });
  await prisma.$disconnect();
});

describe("signup", () => {
  test("creates an active USER, normalizes email, and returns safe tokens", async () => {
    const email = uniqueEmail("signup-success");
    const mixedCaseEmail = email.toUpperCase();
    const response = await request(app).post("/api/v1/auth/signup").send({
      name: "  Signup User  ",
      email: mixedCaseEmail,
      password,
    });

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      name: "Signup User",
      email,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    });
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body).not.toHaveProperty("refreshToken");
    expect(response.body.user).not.toHaveProperty("passwordHash");

    const setCookie = (response.headers["set-cookie"] as string[])[0];
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
    expect(setCookie).toContain("Path=/api/v1/auth");
  });

  test("rejects a duplicate email", async () => {
    const { email } = await signupUser("signup-duplicate");
    const response = await request(app).post("/api/v1/auth/signup").send({
      name: "Duplicate User",
      email,
      password,
    });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
  });

  test("rejects invalid input", async () => {
    const response = await request(app).post("/api/v1/auth/signup").send({
      name: "A",
      email: "not-an-email",
      password: "short",
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("does not accept supplied role or status fields", async () => {
    const email = uniqueEmail("signup-escalation");
    const response = await request(app).post("/api/v1/auth/signup").send({
      name: "Privilege Attempt",
      email,
      password,
      role: UserRole.ADMIN,
      status: UserStatus.SUSPENDED,
    });

    expect(response.status).toBe(400);
    expect(await prisma.user.findUnique({ where: { email } })).toBeNull();
  });
});

describe("login", () => {
  test("logs in a valid USER", async () => {
    const { email } = await signupUser("login-success");
    const response = await request(app).post("/api/v1/auth/login").send({
      email,
      password,
    });

    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe(UserRole.USER);
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user).not.toHaveProperty("passwordHash");
    expect(response.body).not.toHaveProperty("refreshToken");
  });

  test("uses indistinguishable errors for wrong password and unknown email", async () => {
    const { email } = await signupUser("login-invalid");
    const wrongPassword = await request(app).post("/api/v1/auth/login").send({
      email,
      password: "This password is definitely wrong",
    });
    const unknownEmail = await request(app).post("/api/v1/auth/login").send({
      email: uniqueEmail("login-unknown"),
      password,
    });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
    expect(wrongPassword.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  test("rejects a suspended USER", async () => {
    const { email } = await createUser(
      "login-suspended",
      UserRole.USER,
      UserStatus.SUSPENDED,
    );
    const response = await request(app).post("/api/v1/auth/login").send({
      email,
      password,
    });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("ACCOUNT_SUSPENDED");
  });
});

describe("admin login", () => {
  test("logs in an active ADMIN", async () => {
    const { email } = await createUser("admin-success", UserRole.ADMIN);
    const response = await request(app).post("/api/v1/auth/admin/login").send({
      email,
      password,
    });

    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe(UserRole.ADMIN);
  });

  test("rejects a USER with the generic credential error", async () => {
    const { email } = await signupUser("admin-user");
    const response = await request(app).post("/api/v1/auth/admin/login").send({
      email,
      password,
    });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  test("rejects a suspended ADMIN", async () => {
    const { email } = await createUser(
      "admin-suspended",
      UserRole.ADMIN,
      UserStatus.SUSPENDED,
    );
    const response = await request(app).post("/api/v1/auth/admin/login").send({
      email,
      password,
    });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("ACCOUNT_SUSPENDED");
  });
});

describe("access and /me", () => {
  test("returns the current user without requiring a subscription", async () => {
    const { response } = await signupUser("me-success");
    const accessToken = response.body.accessToken as string;
    const userId = response.body.user.id as string;

    expect(
      await prisma.subscription.count({ where: { userId } }),
    ).toBe(0);

    const me = await request(app)
      .get("/api/v1/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(me.status).toBe(200);
    expect(me.body.user.id).toBe(userId);
    expect(me.body.user).not.toHaveProperty("passwordHash");
  });

  test("rejects missing and invalid access tokens", async () => {
    const missing = await request(app).get("/api/v1/me");
    const invalid = await request(app)
      .get("/api/v1/me")
      .set("Authorization", "Bearer not-a-jwt");

    expect(missing.status).toBe(401);
    expect(invalid.status).toBe(401);
    expect(missing.body.error.code).toBe("UNAUTHORIZED");
    expect(invalid.body.error.code).toBe("UNAUTHORIZED");
  });

  test("blocks a user suspended after access-token issuance", async () => {
    const { response } = await signupUser("me-suspended");
    await prisma.user.update({
      where: { id: response.body.user.id as string },
      data: { status: UserStatus.SUSPENDED },
    });

    const me = await request(app)
      .get("/api/v1/me")
      .set("Authorization", `Bearer ${response.body.accessToken as string}`);

    expect(me.status).toBe(403);
    expect(me.body.error.code).toBe("ACCOUNT_SUSPENDED");
  });
});

describe("refresh", () => {
  test("rotates refresh tokens and rejects the old token", async () => {
    const { response } = await signupUser("refresh-rotation");
    const oldCookie = refreshCookie(response);
    const refreshed = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", oldCookie);

    expect(refreshed.status).toBe(200);
    expect(refreshed.body.accessToken).toEqual(expect.any(String));
    expect(refreshed.body).not.toHaveProperty("refreshToken");
    expect(refreshCookie(refreshed)).not.toBe(oldCookie);

    const replay = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", oldCookie);

    expect(replay.status).toBe(401);
    expect(replay.body.error.code).toBe("INVALID_REFRESH_TOKEN");
  });

  test("rejects expired and invalid refresh tokens", async () => {
    const expiredToken = jwt.sign(
      { tokenType: "refresh" },
      env.JWT_REFRESH_SECRET,
      {
        algorithm: "HS256",
        audience: "land-management-web",
        issuer: "land-management-api",
        subject: "expired-test-user",
        jwtid: "expired-test-token",
        expiresIn: -1,
      },
    );
    const expired = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", `refresh_token=${expiredToken}`);
    const invalid = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", "refresh_token=not-a-jwt");

    expect(expired.status).toBe(401);
    expect(invalid.status).toBe(401);
    expect(expired.body.error.code).toBe("INVALID_REFRESH_TOKEN");
    expect(invalid.body.error.code).toBe("INVALID_REFRESH_TOKEN");
  });

  test("rejects refresh for a suspended user", async () => {
    const { response } = await signupUser("refresh-suspended");
    const cookie = refreshCookie(response);
    await prisma.user.update({
      where: { id: response.body.user.id as string },
      data: { status: UserStatus.SUSPENDED },
    });

    const refreshed = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", cookie);

    expect(refreshed.status).toBe(403);
    expect(refreshed.body.error.code).toBe("ACCOUNT_SUSPENDED");
  });
});

describe("logout", () => {
  test("revokes the current refresh token and clears its cookie", async () => {
    const { response } = await signupUser("logout-revoke");
    const cookie = refreshCookie(response);
    const rawToken = cookie.slice("refresh_token=".length);
    const loggedOut = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", cookie);

    expect(loggedOut.status).toBe(204);
    const clearHeader = (loggedOut.headers["set-cookie"] as string[])[0];
    expect(clearHeader).toContain("refresh_token=");
    expect(clearHeader).toContain("Path=/api/v1/auth");
    expect(clearHeader).toMatch(/Expires=Thu, 01 Jan 1970/);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashRefreshToken(rawToken) },
    });
    expect(storedToken?.revokedAt).toBeInstanceOf(Date);

    const replay = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", cookie);
    expect(replay.status).toBe(401);
  });

  test("is idempotent when no refresh cookie exists", async () => {
    const response = await request(app).post("/api/v1/auth/logout");
    expect(response.status).toBe(204);
  });
});

describe("current-role authorization", () => {
  test("uses the current database role rather than the access-token role", async () => {
    const { email, user } = await createUser(
      "role-authoritative",
      UserRole.ADMIN,
    );
    const loginResponse = await request(app)
      .post("/api/v1/auth/admin/login")
      .send({ email, password });
    expect(loginResponse.status).toBe(200);

    await prisma.user.update({
      where: { id: user.id },
      data: { role: UserRole.USER },
    });

    const authorizationProbe = express();
    authorizationProbe.get(
      "/admin-probe",
      requireAuth,
      requireActiveUser,
      requireAdmin,
      (_request, response) => response.status(204).send(),
    );
    authorizationProbe.use(errorHandler);

    const probe = await request(authorizationProbe)
      .get("/admin-probe")
      .set(
        "Authorization",
        `Bearer ${loginResponse.body.accessToken as string}`,
      );

    expect(probe.status).toBe(403);
    expect(probe.body.error.code).toBe("FORBIDDEN");
  });
});
