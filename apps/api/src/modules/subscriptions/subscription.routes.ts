import { Router } from "express";

import { requireActiveUser } from "../../middleware/require-active-user.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { getSubscriptionController } from "./subscription.controller.js";

export const subscriptionRouter = Router();

subscriptionRouter.get(
  "/subscription",
  requireAuth,
  requireActiveUser,
  getSubscriptionController,
);
