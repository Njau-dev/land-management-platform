import { Router } from "express";

import { listPlansController } from "./plan.controller.js";

export const planRouter = Router();

planRouter.get("/plans", listPlansController);
