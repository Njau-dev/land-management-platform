import type { Request, RequestHandler } from "express";

import { AppError } from "../../utils/app-error.js";
import {
  idParamsSchema,
  loanListQuerySchema,
  ownershipListQuerySchema,
  parseAdminInput,
  titleDeedListQuerySchema,
  userListQuerySchema,
  zoningListQuerySchema,
  type CreateLoanInput,
  type CreateOwnershipInput,
  type CreateTitleDeedInput,
  type CreateZoningInput,
  type UpdateLoanInput,
  type UpdateOwnershipInput,
  type UpdateTitleDeedInput,
  type UpdateUserInput,
  type UpdateZoningInput,
} from "./admin.schemas.js";
import {
  createAdminLoan,
  createAdminOwnershipHistory,
  createAdminTitleDeed,
  createAdminZoning,
  deleteAdminLoan,
  deleteAdminOwnershipHistory,
  deleteAdminTitleDeed,
  deleteAdminZoning,
  getAdminAnalytics,
  getAdminLoan,
  getAdminOwnershipHistory,
  getAdminTitleDeed,
  getAdminUser,
  getAdminZoning,
  listAdminLoans,
  listAdminOwnershipHistory,
  listAdminTitleDeeds,
  listAdminUsers,
  listAdminZoning,
  updateAdminLoan,
  updateAdminOwnershipHistory,
  updateAdminTitleDeed,
  updateAdminUserStatus,
  updateAdminZoning,
} from "./admin.service.js";

function requestId(request: Request): string {
  return parseAdminInput(idParamsSchema, request.params).id;
}

function currentAdminId(request: Request): string {
  if (!request.currentUser) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  }
  return request.currentUser.id;
}

export const analyticsController: RequestHandler = async (_request, response) => {
  response.status(200).json({ analytics: await getAdminAnalytics() });
};

export const listUsersController: RequestHandler = async (request, response) => {
  const query = parseAdminInput(userListQuerySchema, request.query);
  response.status(200).json(await listAdminUsers(query));
};

export const getUserController: RequestHandler = async (request, response) => {
  response.status(200).json({ user: await getAdminUser(requestId(request)) });
};

export const updateUserController: RequestHandler = async (request, response) => {
  const user = await updateAdminUserStatus(
    currentAdminId(request),
    requestId(request),
    request.body as UpdateUserInput,
  );
  response.status(200).json({ user });
};

export const listTitleDeedsController: RequestHandler = async (
  request,
  response,
) => {
  const query = parseAdminInput(titleDeedListQuerySchema, request.query);
  response.status(200).json(await listAdminTitleDeeds(query));
};

export const getTitleDeedController: RequestHandler = async (
  request,
  response,
) => {
  response
    .status(200)
    .json({ titleDeed: await getAdminTitleDeed(requestId(request)) });
};

export const createTitleDeedController: RequestHandler = async (
  request,
  response,
) => {
  const titleDeed = await createAdminTitleDeed(
    request.body as CreateTitleDeedInput,
  );
  response.status(201).json({ titleDeed });
};

export const updateTitleDeedController: RequestHandler = async (
  request,
  response,
) => {
  const titleDeed = await updateAdminTitleDeed(
    requestId(request),
    request.body as UpdateTitleDeedInput,
  );
  response.status(200).json({ titleDeed });
};

export const deleteTitleDeedController: RequestHandler = async (
  request,
  response,
) => {
  await deleteAdminTitleDeed(requestId(request));
  response.status(204).send();
};

export const listZoningController: RequestHandler = async (request, response) => {
  const query = parseAdminInput(zoningListQuerySchema, request.query);
  response.status(200).json(await listAdminZoning(query));
};

export const getZoningController: RequestHandler = async (request, response) => {
  response.status(200).json({ zoning: await getAdminZoning(requestId(request)) });
};

export const createZoningController: RequestHandler = async (
  request,
  response,
) => {
  response.status(201).json({
    zoning: await createAdminZoning(request.body as CreateZoningInput),
  });
};

export const updateZoningController: RequestHandler = async (
  request,
  response,
) => {
  response.status(200).json({
    zoning: await updateAdminZoning(
      requestId(request),
      request.body as UpdateZoningInput,
    ),
  });
};

export const deleteZoningController: RequestHandler = async (
  request,
  response,
) => {
  await deleteAdminZoning(requestId(request));
  response.status(204).send();
};

export const listLoansController: RequestHandler = async (request, response) => {
  const query = parseAdminInput(loanListQuerySchema, request.query);
  response.status(200).json(await listAdminLoans(query));
};

export const getLoanController: RequestHandler = async (request, response) => {
  response.status(200).json({ loan: await getAdminLoan(requestId(request)) });
};

export const createLoanController: RequestHandler = async (request, response) => {
  response.status(201).json({
    loan: await createAdminLoan(request.body as CreateLoanInput),
  });
};

export const updateLoanController: RequestHandler = async (request, response) => {
  response.status(200).json({
    loan: await updateAdminLoan(
      requestId(request),
      request.body as UpdateLoanInput,
    ),
  });
};

export const deleteLoanController: RequestHandler = async (request, response) => {
  await deleteAdminLoan(requestId(request));
  response.status(204).send();
};

export const listOwnershipController: RequestHandler = async (
  request,
  response,
) => {
  const query = parseAdminInput(ownershipListQuerySchema, request.query);
  response.status(200).json(await listAdminOwnershipHistory(query));
};

export const getOwnershipController: RequestHandler = async (
  request,
  response,
) => {
  response.status(200).json({
    ownershipHistory: await getAdminOwnershipHistory(requestId(request)),
  });
};

export const createOwnershipController: RequestHandler = async (
  request,
  response,
) => {
  response.status(201).json({
    ownershipHistory: await createAdminOwnershipHistory(
      request.body as CreateOwnershipInput,
    ),
  });
};

export const updateOwnershipController: RequestHandler = async (
  request,
  response,
) => {
  response.status(200).json({
    ownershipHistory: await updateAdminOwnershipHistory(
      requestId(request),
      request.body as UpdateOwnershipInput,
    ),
  });
};

export const deleteOwnershipController: RequestHandler = async (
  request,
  response,
) => {
  await deleteAdminOwnershipHistory(requestId(request));
  response.status(204).send();
};
