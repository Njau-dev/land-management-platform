import type {
  AuthIdentity,
  SafeUser,
} from "../modules/auth/auth.types.js";
import type { getCurrentSubscription } from "../modules/subscriptions/subscription.service.js";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthIdentity;
      currentUser?: SafeUser;
      currentSubscription?: NonNullable<
        Awaited<ReturnType<typeof getCurrentSubscription>>
      >;
    }
  }
}

export {};
