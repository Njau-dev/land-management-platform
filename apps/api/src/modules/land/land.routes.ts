import { Router } from "express";

import { requireActiveUser } from "../../middleware/require-active-user.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { requireSubscription } from "../../middleware/require-subscription.js";
import {
  downloadLandReportController,
  searchLandController,
} from "./land.controller.js";

export const landRouter = Router();

landRouter.get(
  "/land/search/:titleDeedNumber/report",
  requireAuth,
  requireActiveUser,
  requireSubscription,
  downloadLandReportController,
);

landRouter.get(
  "/land/search/:titleDeedNumber",
  requireAuth,
  requireActiveUser,
  requireSubscription,
  searchLandController,
);
