import { Router } from "express";

import { requireActiveUser } from "../../middleware/require-active-user.js";
import { requireAuth } from "../../middleware/require-auth.js";
import {
  adminLoginRateLimit,
  loginRateLimit,
  refreshRateLimit,
  signupRateLimit,
} from "../../middleware/rate-limit.js";
import { validateBody } from "../../middleware/validate-request.js";
import {
  adminLoginController,
  loginController,
  logoutController,
  meController,
  refreshController,
  signupController,
} from "./auth.controller.js";
import { loginSchema, signupSchema } from "./auth.schemas.js";

export const authRouter = Router();

authRouter.post(
  "/auth/signup",
  signupRateLimit,
  validateBody(signupSchema),
  signupController,
);
authRouter.post(
  "/auth/login",
  loginRateLimit,
  validateBody(loginSchema),
  loginController,
);
authRouter.post(
  "/auth/admin/login",
  adminLoginRateLimit,
  validateBody(loginSchema),
  adminLoginController,
);
authRouter.post("/auth/refresh", refreshRateLimit, refreshController);
authRouter.post("/auth/logout", logoutController);
authRouter.get("/me", requireAuth, requireActiveUser, meController);
