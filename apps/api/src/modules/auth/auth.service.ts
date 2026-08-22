import { compare, hash } from "bcryptjs";

import {
  UserRole,
  UserStatus,
} from "../../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/app-error.js";
import type { LoginInput, SignupInput } from "./auth.schemas.js";
import {
  hashRefreshToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "./auth.tokens.js";
import type {
  AuthSessionResult,
  RefreshResult,
  SafeUser,
} from "./auth.types.js";

const BCRYPT_COST = 12;
const DUMMY_PASSWORD_HASH =
  "$2b$12$z8qxpjecdZUc5VtTFUff9OR58zThlmtMdgO3Ag8JzeQrnImH5n5va";

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
} as const;

function invalidCredentials(): AppError {
  return new AppError(
    401,
    "INVALID_CREDENTIALS",
    "Invalid email or password",
  );
}

function suspendedAccount(): AppError {
  return new AppError(403, "ACCOUNT_SUSPENDED", "Account is suspended");
}

function invalidRefreshToken(): AppError {
  return new AppError(
    401,
    "INVALID_REFRESH_TOKEN",
    "Invalid or expired refresh token",
  );
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

function createTokens(user: SafeUser) {
  const accessToken = signAccessToken(user);
  const refresh = signRefreshToken(user.id);

  return { accessToken, refresh };
}

export async function signup(input: SignupInput): Promise<AuthSessionResult> {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError(
      409,
      "EMAIL_ALREADY_EXISTS",
      "An account with this email already exists",
    );
  }

  const passwordHash = await hash(input.password, BCRYPT_COST);

  try {
    return await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
        },
        select: safeUserSelect,
      });
      const tokens = createTokens(user);

      await transaction.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: tokens.refresh.tokenHash,
          expiresAt: tokens.refresh.expiresAt,
        },
      });

      return {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refresh.token,
      };
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError(
        409,
        "EMAIL_ALREADY_EXISTS",
        "An account with this email already exists",
      );
    }

    throw error;
  }
}

export async function login(
  input: LoginInput,
  expectedRole: UserRole,
): Promise<AuthSessionResult> {
  const userWithPassword = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      ...safeUserSelect,
      passwordHash: true,
    },
  });

  const passwordMatches = await compare(
    input.password,
    userWithPassword?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );

  if (
    !userWithPassword ||
    !passwordMatches ||
    userWithPassword.role !== expectedRole
  ) {
    throw invalidCredentials();
  }

  if (userWithPassword.status === UserStatus.SUSPENDED) {
    throw suspendedAccount();
  }

  const { passwordHash: _passwordHash, ...user } = userWithPassword;
  const tokens = createTokens(user);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: tokens.refresh.tokenHash,
      expiresAt: tokens.refresh.expiresAt,
    },
  });

  return {
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refresh.token,
  };
}

export async function refreshSession(
  rawRefreshToken: string | undefined,
): Promise<RefreshResult> {
  if (!rawRefreshToken) {
    throw invalidRefreshToken();
  }

  const identity = verifyRefreshToken(rawRefreshToken);
  const tokenHash = hashRefreshToken(rawRefreshToken);
  const now = new Date();
  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: { select: safeUserSelect } },
  });

  if (
    !storedToken ||
    storedToken.userId !== identity.userId ||
    storedToken.revokedAt !== null ||
    storedToken.expiresAt <= now
  ) {
    throw invalidRefreshToken();
  }

  if (storedToken.user.status === UserStatus.SUSPENDED) {
    throw suspendedAccount();
  }

  const tokens = createTokens(storedToken.user);

  await prisma.$transaction(async (transaction) => {
    const revokeResult = await transaction.refreshToken.updateMany({
      where: {
        id: storedToken.id,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: { revokedAt: now },
    });

    if (revokeResult.count !== 1) {
      throw invalidRefreshToken();
    }

    await transaction.refreshToken.create({
      data: {
        userId: storedToken.userId,
        tokenHash: tokens.refresh.tokenHash,
        expiresAt: tokens.refresh.expiresAt,
      },
    });
  });

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refresh.token,
  };
}

export async function logout(rawRefreshToken: string | undefined): Promise<void> {
  if (!rawRefreshToken) {
    return;
  }

  await prisma.refreshToken.updateMany({
    where: {
      tokenHash: hashRefreshToken(rawRefreshToken),
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
}
