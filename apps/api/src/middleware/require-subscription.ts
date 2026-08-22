import type { RequestHandler } from "express";

import { getCurrentSubscription } from "../modules/subscriptions/subscription.service.js";
import { AppError } from "../utils/app-error.js";

export const requireSubscription: RequestHandler = async (
  request,
  _response,
  next,
) => {
  if (!request.currentUser) {
    next(new AppError(401, "UNAUTHORIZED", "Authentication required"));
    return;
  }

  const subscription = await getCurrentSubscription(request.currentUser.id);

  if (!subscription) {
    next(
      new AppError(
        403,
        "SUBSCRIPTION_REQUIRED",
        "An active subscription is required",
      ),
    );
    return;
  }

  request.currentSubscription = subscription;
  next();
};
