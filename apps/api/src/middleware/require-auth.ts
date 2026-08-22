import type { RequestHandler } from "express";

import { verifyAccessToken } from "../modules/auth/auth.tokens.js";
import { AppError } from "../utils/app-error.js";

export const requireAuth: RequestHandler = (request, _response, next) => {
  const authorization = request.header("authorization");
  const [scheme, token, ...rest] = authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token || rest.length > 0) {
    next(new AppError(401, "UNAUTHORIZED", "Authentication required"));
    return;
  }

  try {
    request.auth = verifyAccessToken(token);
    next();
  } catch (error) {
    next(error);
  }
};
