import type { ErrorRequestHandler, RequestHandler } from "express";

import { AppError } from "../utils/app-error.js";

export const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json({
    status: "error",
    error: {
      code: "NOT_FOUND",
      message: "Route not found",
    },
  });
};

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  if (error instanceof AppError) {
    const body: {
      status: "error";
      error: { code: string; message: string; details?: unknown };
    } = {
      status: "error",
      error: {
        code: error.code,
        message: error.message,
      },
    };

    if (error.details !== undefined) {
      body.error.details = error.details;
    }

    response.status(error.statusCode).json(body);
    return;
  }

  console.error("Unhandled request error", error);

  response.status(500).json({
    status: "error",
    error: {
      code: "INTERNAL_ERROR",
      message: "Internal server error",
    },
  });
};
