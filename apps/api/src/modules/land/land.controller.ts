import type { RequestHandler } from "express";

import { AppError } from "../../utils/app-error.js";
import { createLandSearchReport } from "./land.report.js";
import { landSearchParamsSchema } from "./land.schemas.js";
import {
  lookupLandByTitleDeedNumber,
  recordLandSearch,
} from "./land.service.js";

function searchContext(request: Parameters<RequestHandler>[0]): {
  userId: string;
  titleDeedNumber: string;
} {
  if (!request.currentUser) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  }

  const parsed = landSearchParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "Invalid title deed number",
      parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    );
  }

  return {
    userId: request.currentUser.id,
    titleDeedNumber: parsed.data.titleDeedNumber,
  };
}

export const searchLandController: RequestHandler = async (request, response) => {
  const context = searchContext(request);
  const lookup = await lookupLandByTitleDeedNumber(context.titleDeedNumber);

  await recordLandSearch({
    userId: context.userId,
    titleDeedId: lookup?.titleDeedId ?? null,
    searchedTitleNumber: context.titleDeedNumber,
  });

  if (!lookup) {
    throw new AppError(
      404,
      "TITLE_DEED_NOT_FOUND",
      "Title deed not found in the current dataset",
    );
  }

  response.status(200).json(lookup.result);
};

export const downloadLandReportController: RequestHandler = async (
  request,
  response,
) => {
  const context = searchContext(request);
  const lookup = await lookupLandByTitleDeedNumber(context.titleDeedNumber);

  if (!lookup) {
    throw new AppError(
      404,
      "TITLE_DEED_NOT_FOUND",
      "Title deed not found in the current dataset",
    );
  }

  const report = await createLandSearchReport(lookup.result);
  response.setHeader("Content-Type", "application/pdf");
  response.setHeader(
    "Content-Disposition",
    `attachment; filename="${report.filename}"`,
  );
  response.setHeader("X-Report-Reference", report.reference);
  response.status(200).send(report.buffer);
};
