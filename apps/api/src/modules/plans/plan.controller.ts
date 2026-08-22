import type { RequestHandler } from "express";

import { listActivePlans } from "./plan.service.js";

export const listPlansController: RequestHandler = async (_request, response) => {
  const plans = await listActivePlans();
  response.status(200).json({ plans });
};
