import { Router } from "express";

import { requireActiveUser } from "../../middleware/require-active-user.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { validateBody } from "../../middleware/validate-request.js";
import {
  getPaymentStatusController,
  initiatePaymentController,
  listPaymentsController,
  mpesaCallbackController,
} from "./payment.controller.js";
import {
  initiatePaymentSchema,
  mpesaCallbackSchema,
} from "./payment.schemas.js";

export const paymentRouter = Router();

paymentRouter.post(
  "/payments/mpesa/callback",
  validateBody(mpesaCallbackSchema),
  mpesaCallbackController,
);
paymentRouter.post(
  "/payments/mpesa/initiate",
  requireAuth,
  requireActiveUser,
  validateBody(initiatePaymentSchema),
  initiatePaymentController,
);
paymentRouter.get(
  "/payments/:paymentId/status",
  requireAuth,
  requireActiveUser,
  getPaymentStatusController,
);
paymentRouter.get(
  "/payments",
  requireAuth,
  requireActiveUser,
  listPaymentsController,
);
