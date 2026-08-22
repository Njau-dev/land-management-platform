const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!configuredApiUrl) {
  throw new Error("NEXT_PUBLIC_API_URL is not configured");
}

const API_URL = configuredApiUrl.replace(/\/$/, "");

interface BackendErrorBody {
  status?: unknown;
  error?: {
    code?: unknown;
    message?: unknown;
    details?: unknown;
  };
}

interface RefreshResponse {
  accessToken: string;
}

interface AuthLifecycleCallbacks {
  onAccessToken: (accessToken: string) => void;
  onSessionExpired: () => void;
}

export interface ApiRequestOptions
  extends Omit<RequestInit, "body" | "credentials"> {
  body?: unknown;
  useAccessToken?: boolean;
  retryAfterRefresh?: boolean;
}

export interface ApiBlobResponse {
  blob: Blob;
  filename: string | null;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown | undefined;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;
let lifecycleCallbacks: AuthLifecycleCallbacks | null = null;

const refreshExcludedPaths = new Set([
  "/auth/signup",
  "/auth/login",
  "/auth/admin/login",
  "/auth/refresh",
]);

export function setApiAccessToken(token: string | null): void {
  accessToken = token;
}

export function registerAuthLifecycle(
  callbacks: AuthLifecycleCallbacks,
): () => void {
  lifecycleCallbacks = callbacks;

  return () => {
    if (lifecycleCallbacks === callbacks) {
      lifecycleCallbacks = null;
    }
  };
}

function createHeaders(options: ApiRequestOptions, token: string | null): Headers {
  const headers = new Headers(options.headers);

  if (options.body !== undefined && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  if (token && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${token}`);
  }

  return headers;
}

async function sendRequest(
  path: string,
  options: ApiRequestOptions,
  token: string | null,
): Promise<Response> {
  const body = options.body;
  const requestOptions = {
    ...options,
    body: undefined,
  } as RequestInit & {
    useAccessToken?: boolean;
    retryAfterRefresh?: boolean;
  };
  delete requestOptions.useAccessToken;
  delete requestOptions.retryAfterRefresh;

  try {
    return await fetch(`${API_URL}${path}`, {
      ...requestOptions,
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: createHeaders(options, token),
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Unable to reach the server. Please try again.",
    );
  }
}

function isBackendErrorBody(value: unknown): value is BackendErrorBody {
  return typeof value === "object" && value !== null;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let data: unknown;

  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = undefined;
  }

  if (!response.ok) {
    if (
      isBackendErrorBody(data) &&
      typeof data.error?.code === "string" &&
      typeof data.error.message === "string"
    ) {
      throw new ApiError(
        response.status,
        data.error.code,
        data.error.message,
        data.error.details,
      );
    }

    throw new ApiError(
      response.status,
      "REQUEST_FAILED",
      "The request could not be completed.",
    );
  }

  return data as T;
}

async function sendAuthenticatedRequest(
  path: string,
  options: ApiRequestOptions,
): Promise<Response> {
  const useAccessToken = options.useAccessToken ?? true;
  const retryAfterRefresh =
    !refreshExcludedPaths.has(path) &&
    (options.retryAfterRefresh ?? useAccessToken);
  const response = await sendRequest(
    path,
    options,
    useAccessToken ? accessToken : null,
  );

  if (response.status !== 401 || !retryAfterRefresh) {
    return response;
  }

  const refreshedToken = await refreshAccessToken();

  if (!refreshedToken) {
    throw new ApiError(401, "UNAUTHORIZED", "Your session has expired.");
  }

  return sendRequest(path, options, refreshedToken);
}

export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await sendRequest(
          "/auth/refresh",
          { method: "POST", useAccessToken: false, retryAfterRefresh: false },
          null,
        );
        const data = await parseResponse<RefreshResponse>(response);

        setApiAccessToken(data.accessToken);
        lifecycleCallbacks?.onAccessToken(data.accessToken);
        return data.accessToken;
      } catch {
        setApiAccessToken(null);
        lifecycleCallbacks?.onSessionExpired();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  return parseResponse<T>(await sendAuthenticatedRequest(path, options));
}

export async function apiBlobRequest(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiBlobResponse> {
  const response = await sendAuthenticatedRequest(path, options);

  if (!response.ok) {
    return parseResponse<never>(response);
  }

  const disposition = response.headers.get("content-disposition");
  const filenameMatch = disposition?.match(/filename="([^"\r\n]+)"/i);

  return {
    blob: await response.blob(),
    filename: filenameMatch?.[1] ?? null,
  };
}
