import type { RequestHandler } from "express";

import { AppError } from "../../utils/app-error.js";
import { getCurrentSubscription } from "./subscription.service.js";

export const getSubscriptionController: RequestHandler = async (
  request,
  response,
) => {
  if (!request.currentUser) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  }

  const subscription = await getCurrentSubscription(request.currentUser.id);
  response.status(200).json({ activeSubscription: subscription });
};
