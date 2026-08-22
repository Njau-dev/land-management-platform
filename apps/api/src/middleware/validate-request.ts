import type { RequestHandler } from "express";
import type { ZodType } from "zod";

import { AppError, type ValidationIssue } from "../utils/app-error.js";

export function validateBody(schema: ZodType): RequestHandler {
  return (request, _response, next) => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      const details: ValidationIssue[] = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));

      next(new AppError(400, "VALIDATION_ERROR", "Invalid request", details));
      return;
    }

    request.body = result.data;
    next();
  };
}
