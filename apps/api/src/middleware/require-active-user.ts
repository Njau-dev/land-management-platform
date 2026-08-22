import type { RequestHandler } from "express";

import { UserStatus } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";

export const requireActiveUser: RequestHandler = async (
  request,
  _response,
  next,
) => {
  if (!request.auth) {
    next(new AppError(401, "UNAUTHORIZED", "Authentication required"));
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: request.auth.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  if (!user) {
    next(new AppError(401, "UNAUTHORIZED", "Authentication required"));
    return;
  }

  if (user.status === UserStatus.SUSPENDED) {
    next(new AppError(403, "ACCOUNT_SUSPENDED", "Account is suspended"));
    return;
  }

  request.currentUser = user;
  next();
};
