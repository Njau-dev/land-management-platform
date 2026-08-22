import { apiRequest } from "@/lib/api-client";

import type {
  AuthResponse,
  LoginInput,
  MeResponse,
  SignupInput,
} from "./auth.types";

const publicRequestOptions = {
  useAccessToken: false,
  retryAfterRefresh: false,
} as const;

export function signupRequest(input: SignupInput): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/signup", {
    ...publicRequestOptions,
    method: "POST",
    body: input,
  });
}

export function loginRequest(input: LoginInput): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/login", {
    ...publicRequestOptions,
    method: "POST",
    body: input,
  });
}

export function adminLoginRequest(input: LoginInput): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/admin/login", {
    ...publicRequestOptions,
    method: "POST",
    body: input,
  });
}

export function meRequest(retryAfterRefresh = true): Promise<MeResponse> {
  return apiRequest<MeResponse>("/me", {
    method: "GET",
    retryAfterRefresh,
  });
}

export function logoutRequest(): Promise<void> {
  return apiRequest<void>("/auth/logout", {
    ...publicRequestOptions,
    method: "POST",
  });
}
