import type { RequestHandler } from "express";

import { UserRole } from "../../generated/prisma/client.js";
import { AppError } from "../utils/app-error.js";

export const requireAdmin: RequestHandler = (request, _response, next) => {
  if (!request.currentUser) {
    next(new AppError(401, "UNAUTHORIZED", "Authentication required"));
    return;
  }

  if (request.currentUser.role !== UserRole.ADMIN) {
    next(new AppError(403, "FORBIDDEN", "Insufficient permissions"));
    return;
  }

  next();
};
