import cors from "cors";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json());

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

app.use((_request: Request, response: Response) => {
  response.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

app.use(
  (
    error: unknown,
    _request: Request,
    response: Response,
    _next: NextFunction,
  ) => {
    console.error("Unhandled request error", error);

    response.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  },
);

export { app };
