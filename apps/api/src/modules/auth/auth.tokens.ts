import { createHash, randomBytes } from "node:crypto";

import type { CookieOptions, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

import { UserRole } from "../../../generated/prisma/client.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";
import type { AuthIdentity, SafeUser } from "./auth.types.js";

const JWT_ALGORITHM = "HS256" as const;
const JWT_ISSUER = "land-management-api";
const JWT_AUDIENCE = "land-management-web";

export const REFRESH_COOKIE_NAME = "refresh_token";

function isJwtPayload(payload: string | JwtPayload): payload is JwtPayload {
  return typeof payload === "object" && payload !== null;
}

function isUserRole(value: unknown): value is UserRole {
  return value === UserRole.USER || value === UserRole.ADMIN;
}

function invalidAccessToken(): AppError {
  return new AppError(401, "UNAUTHORIZED", "Authentication required");
}

function invalidRefreshToken(): AppError {
  return new AppError(
    401,
    "INVALID_REFRESH_TOKEN",
    "Invalid or expired refresh token",
  );
}

export function signAccessToken(
  user: Pick<SafeUser, "id" | "role">,
): string {
  return jwt.sign(
    {
      tokenType: "access",
      role: user.role,
    },
    env.JWT_ACCESS_SECRET,
    {
      algorithm: JWT_ALGORITHM,
      audience: JWT_AUDIENCE,
      issuer: JWT_ISSUER,
      subject: user.id,
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    },
  );
}

export function signRefreshToken(userId: string): {
  token: string;
  tokenHash: string;
  expiresAt: Date;
} {
  const token = jwt.sign(
    { tokenType: "refresh" },
    env.JWT_REFRESH_SECRET,
    {
      algorithm: JWT_ALGORITHM,
      audience: JWT_AUDIENCE,
      issuer: JWT_ISSUER,
      subject: userId,
      jwtid: randomBytes(18).toString("base64url"),
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },
  );

  const decoded = jwt.decode(token);

  if (!decoded || typeof decoded === "string" || !decoded.exp) {
    throw new Error("Unable to determine refresh token expiry");
  }

  return {
    token,
    tokenHash: hashRefreshToken(token),
    expiresAt: new Date(decoded.exp * 1_000),
  };
}

export function verifyAccessToken(token: string): AuthIdentity {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: [JWT_ALGORITHM],
      audience: JWT_AUDIENCE,
      issuer: JWT_ISSUER,
    });

    if (
      !isJwtPayload(payload) ||
      payload["tokenType"] !== "access" ||
      typeof payload.sub !== "string" ||
      !isUserRole(payload["role"])
    ) {
      throw invalidAccessToken();
    }

    return {
      userId: payload.sub,
      role: payload["role"],
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw invalidAccessToken();
  }
}

export function verifyRefreshToken(token: string): { userId: string } {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET, {
      algorithms: [JWT_ALGORITHM],
      audience: JWT_AUDIENCE,
      issuer: JWT_ISSUER,
    });

    if (
      !isJwtPayload(payload) ||
      payload["tokenType"] !== "refresh" ||
      typeof payload.sub !== "string" ||
      typeof payload.jti !== "string"
    ) {
      throw invalidRefreshToken();
    }

    return { userId: payload.sub };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw invalidRefreshToken();
  }
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

const baseRefreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/v1/auth",
};

export function setRefreshCookie(response: Response, token: string): void {
  response.cookie(REFRESH_COOKIE_NAME, token, {
    ...baseRefreshCookieOptions,
    maxAge: env.JWT_REFRESH_EXPIRES_IN * 1_000,
  });
}

export function clearRefreshCookie(response: Response): void {
  response.clearCookie(REFRESH_COOKIE_NAME, baseRefreshCookieOptions);
}
