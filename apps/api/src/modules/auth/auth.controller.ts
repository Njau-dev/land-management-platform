import type { RequestHandler } from "express";

import { UserRole } from "../../../generated/prisma/client.js";
import type { LoginInput, SignupInput } from "./auth.schemas.js";
import {
  login,
  logout,
  refreshSession,
  signup,
} from "./auth.service.js";
import {
  clearRefreshCookie,
  REFRESH_COOKIE_NAME,
  setRefreshCookie,
} from "./auth.tokens.js";

function readRefreshCookie(request: Parameters<RequestHandler>[0]):
  | string
  | undefined {
  const cookie = request.cookies[REFRESH_COOKIE_NAME] as unknown;
  return typeof cookie === "string" ? cookie : undefined;
}

export const signupController: RequestHandler = async (request, response) => {
  const result = await signup(request.body as SignupInput);
  setRefreshCookie(response, result.refreshToken);

  response.status(201).json({
    user: result.user,
    accessToken: result.accessToken,
  });
};

export const loginController: RequestHandler = async (request, response) => {
  const result = await login(request.body as LoginInput, UserRole.USER);
  setRefreshCookie(response, result.refreshToken);

  response.status(200).json({
    user: result.user,
    accessToken: result.accessToken,
  });
};

export const adminLoginController: RequestHandler = async (
  request,
  response,
) => {
  const result = await login(request.body as LoginInput, UserRole.ADMIN);
  setRefreshCookie(response, result.refreshToken);

  response.status(200).json({
    user: result.user,
    accessToken: result.accessToken,
  });
};

export const refreshController: RequestHandler = async (request, response) => {
  const result = await refreshSession(readRefreshCookie(request));
  setRefreshCookie(response, result.refreshToken);

  response.status(200).json({ accessToken: result.accessToken });
};

export const logoutController: RequestHandler = async (request, response) => {
  await logout(readRefreshCookie(request));
  clearRefreshCookie(response);
  response.status(204).send();
};

export const meController: RequestHandler = (request, response) => {
  response.status(200).json({ user: request.currentUser });
};
