import { rateLimit } from "express-rate-limit";

import { env } from "../config/env.js";

const commonOptions = {
  standardHeaders: "draft-7" as const,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "test",
  handler: (_request: unknown, response: import("express").Response) => {
    response.status(429).json({
      status: "error",
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests; please try again later",
      },
    });
  },
};

export const signupRateLimit = rateLimit({
  ...commonOptions,
  windowMs: 60 * 60 * 1_000,
  limit: 10,
});

export const loginRateLimit = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1_000,
  limit: 10,
});

export const adminLoginRateLimit = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1_000,
  limit: 5,
});

export const refreshRateLimit = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1_000,
  limit: 30,
});
