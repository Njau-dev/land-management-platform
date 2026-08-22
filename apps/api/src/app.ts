import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { adminRouter } from "./modules/admin/admin.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { landRouter } from "./modules/land/land.routes.js";
import { paymentRouter } from "./modules/payments/payment.routes.js";
import { planRouter } from "./modules/plans/plan.routes.js";
import { subscriptionRouter } from "./modules/subscriptions/subscription.routes.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    exposedHeaders: ["Content-Disposition", "X-Report-Reference"],
  }),
);
app.use(express.json());
app.use(cookieParser());

if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.get("/api/v1/health", async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    response.status(200).json({
      status: "ok",
      api: "up",
      database: "up",
    });
  } catch {
    response.status(503).json({
      status: "error",
      api: "up",
      database: "down",
    });
  }
});

app.use("/api/v1", authRouter);
app.use("/api/v1", planRouter);
app.use("/api/v1", subscriptionRouter);
app.use("/api/v1", paymentRouter);
app.use("/api/v1", landRouter);
app.use("/api/v1", adminRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
