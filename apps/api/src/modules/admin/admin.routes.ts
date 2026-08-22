import { Router } from "express";

import { requireActiveUser } from "../../middleware/require-active-user.js";
import { requireAdmin } from "../../middleware/require-admin.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { validateBody } from "../../middleware/validate-request.js";
import {
  analyticsController,
  createLoanController,
  createOwnershipController,
  createTitleDeedController,
  createZoningController,
  deleteLoanController,
  deleteOwnershipController,
  deleteTitleDeedController,
  deleteZoningController,
  getLoanController,
  getOwnershipController,
  getTitleDeedController,
  getUserController,
  getZoningController,
  listLoansController,
  listOwnershipController,
  listTitleDeedsController,
  listUsersController,
  listZoningController,
  updateLoanController,
  updateOwnershipController,
  updateTitleDeedController,
  updateUserController,
  updateZoningController,
} from "./admin.controller.js";
import {
  createLoanSchema,
  createOwnershipSchema,
  createTitleDeedSchema,
  createZoningSchema,
  updateLoanSchema,
  updateOwnershipSchema,
  updateTitleDeedSchema,
  updateUserSchema,
  updateZoningSchema,
} from "./admin.schemas.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireActiveUser, requireAdmin);

adminRouter.get("/admin/analytics", analyticsController);

adminRouter.get("/admin/users", listUsersController);
adminRouter.get("/admin/users/:id", getUserController);
adminRouter.patch(
  "/admin/users/:id",
  validateBody(updateUserSchema),
  updateUserController,
);

adminRouter.get("/admin/title-deeds", listTitleDeedsController);
adminRouter.post(
  "/admin/title-deeds",
  validateBody(createTitleDeedSchema),
  createTitleDeedController,
);
adminRouter.get("/admin/title-deeds/:id", getTitleDeedController);
adminRouter.patch(
  "/admin/title-deeds/:id",
  validateBody(updateTitleDeedSchema),
  updateTitleDeedController,
);
adminRouter.delete("/admin/title-deeds/:id", deleteTitleDeedController);

adminRouter.get("/admin/zoning", listZoningController);
adminRouter.post(
  "/admin/zoning",
  validateBody(createZoningSchema),
  createZoningController,
);
adminRouter.get("/admin/zoning/:id", getZoningController);
adminRouter.patch(
  "/admin/zoning/:id",
  validateBody(updateZoningSchema),
  updateZoningController,
);
adminRouter.delete("/admin/zoning/:id", deleteZoningController);

adminRouter.get("/admin/loans", listLoansController);
adminRouter.post(
  "/admin/loans",
  validateBody(createLoanSchema),
  createLoanController,
);
adminRouter.get("/admin/loans/:id", getLoanController);
adminRouter.patch(
  "/admin/loans/:id",
  validateBody(updateLoanSchema),
  updateLoanController,
);
adminRouter.delete("/admin/loans/:id", deleteLoanController);

adminRouter.get("/admin/ownership-history", listOwnershipController);
adminRouter.post(
  "/admin/ownership-history",
  validateBody(createOwnershipSchema),
  createOwnershipController,
);
adminRouter.get("/admin/ownership-history/:id", getOwnershipController);
adminRouter.patch(
  "/admin/ownership-history/:id",
  validateBody(updateOwnershipSchema),
  updateOwnershipController,
);
adminRouter.delete(
  "/admin/ownership-history/:id",
  deleteOwnershipController,
);
