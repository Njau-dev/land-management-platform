import { apiRequest } from "@/lib/api-client";

import type {
  AdminAnalytics,
  AdminRecord,
  AdminResource,
  AdminTitleDeed,
  AdminUser,
  AdminUserDetail,
  PaginatedResponse,
} from "./admin.types";

type QueryValue = string | number | undefined;

function queryString(values: Record<string, QueryValue>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function getAdminAnalyticsRequest(): Promise<AdminAnalytics> {
  const response = await apiRequest<{ analytics: AdminAnalytics }>(
    "/admin/analytics",
    { method: "GET" },
  );
  return response.analytics;
}

export function listAdminUsersRequest(query: Record<string, QueryValue>) {
  return apiRequest<PaginatedResponse<AdminUser>>(
    `/admin/users${queryString(query)}`,
    { method: "GET" },
  );
}

export async function getAdminUserRequest(id: string): Promise<AdminUserDetail> {
  const response = await apiRequest<{ user: AdminUserDetail }>(
    `/admin/users/${encodeURIComponent(id)}`,
    { method: "GET" },
  );
  return response.user;
}

export async function updateAdminUserStatusRequest(
  id: string,
  status: "ACTIVE" | "SUSPENDED",
): Promise<AdminUser> {
  const response = await apiRequest<{ user: AdminUser }>(
    `/admin/users/${encodeURIComponent(id)}`,
    { method: "PATCH", body: { status } },
  );
  return response.user;
}

export function listAdminRecordsRequest<T extends AdminRecord>(
  resource: AdminResource,
  query: Record<string, QueryValue>,
) {
  return apiRequest<PaginatedResponse<T>>(
    `/admin/${resource}${queryString(query)}`,
    { method: "GET" },
  );
}

const envelopeKeys = {
  "title-deeds": "titleDeed",
  zoning: "zoning",
  loans: "loan",
  "ownership-history": "ownershipHistory",
} as const;

function recordFromEnvelope<T extends AdminRecord>(
  resource: AdminResource,
  response: Record<string, unknown>,
): T {
  return response[envelopeKeys[resource]] as T;
}

export async function getAdminRecordRequest<T extends AdminRecord>(
  resource: AdminResource,
  id: string,
): Promise<T> {
  const response = await apiRequest<Record<string, unknown>>(
    `/admin/${resource}/${encodeURIComponent(id)}`,
    { method: "GET" },
  );
  return recordFromEnvelope<T>(resource, response);
}

export async function createAdminRecordRequest<T extends AdminRecord>(
  resource: AdminResource,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await apiRequest<Record<string, unknown>>(
    `/admin/${resource}`,
    { method: "POST", body },
  );
  return recordFromEnvelope<T>(resource, response);
}

export async function updateAdminRecordRequest<T extends AdminRecord>(
  resource: AdminResource,
  id: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await apiRequest<Record<string, unknown>>(
    `/admin/${resource}/${encodeURIComponent(id)}`,
    { method: "PATCH", body },
  );
  return recordFromEnvelope<T>(resource, response);
}

export function deleteAdminRecordRequest(resource: AdminResource, id: string) {
  return apiRequest<void>(`/admin/${resource}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function getTitleDeedOptionsRequest(): Promise<AdminTitleDeed[]> {
  const response = await listAdminRecordsRequest<AdminTitleDeed>("title-deeds", {
    page: 1,
    limit: 100,
  });
  return response.items;
}
