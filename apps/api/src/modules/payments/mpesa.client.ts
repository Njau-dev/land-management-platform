import { z } from "zod";

import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";

const MPESA_BASE_URLS = {
  sandbox: "https://sandbox.safaricom.co.ke",
  production: "https://api.safaricom.co.ke",
} as const;

const oauthResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.coerce.number().int().positive(),
});

const stkResponseSchema = z.object({
  MerchantRequestID: z.string().min(1),
  CheckoutRequestID: z.string().min(1),
  ResponseCode: z.string(),
  ResponseDescription: z.string().optional(),
  CustomerMessage: z.string().optional(),
});

interface CachedToken {
  token: string;
  refreshAt: number;
}

export interface StkPushInput {
  amountKes: number;
  phoneNumber: string;
  accountReference: string;
}

export interface StkPushResult {
  merchantRequestId: string;
  checkoutRequestId: string;
  responseCode: string;
  responseDescription: string | undefined;
  customerMessage: string | undefined;
}

export class MpesaProviderError extends AppError {
  readonly safeProviderMetadata: Record<string, string | number | boolean | null>;

  constructor(
    code: "MPESA_AUTH_FAILED" | "MPESA_STK_INITIATION_FAILED",
    message: string,
    safeProviderMetadata: Record<string, string | number | boolean | null> = {},
  ) {
    super(502, code, message);
    this.name = "MpesaProviderError";
    this.safeProviderMetadata = safeProviderMetadata;
  }
}

let cachedToken: CachedToken | null = null;

function mpesaUrl(path: string): string {
  return `${MPESA_BASE_URLS[env.MPESA_ENVIRONMENT]}${path}`;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function safeProviderFields(value: unknown) {
  if (!value || typeof value !== "object") {
    return {};
  }

  const record = value as Record<string, unknown>;
  const safe: Record<string, string | number | boolean | null> = {};

  for (const key of [
    "errorCode",
    "errorMessage",
    "requestId",
    "ResponseCode",
    "ResponseDescription",
    "CustomerMessage",
  ]) {
    const field = record[key];
    if (
      typeof field === "string" ||
      typeof field === "number" ||
      typeof field === "boolean" ||
      field === null
    ) {
      safe[key] = field;
    }
  }

  return safe;
}

export async function getMpesaAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.refreshAt) {
    return cachedToken.token;
  }

  let response: Response;

  try {
    response = await fetch(
      mpesaUrl("/oauth/v1/generate?grant_type=client_credentials"),
      {
        method: "GET",
        headers: {
          authorization: `Basic ${Buffer.from(
            `${env.MPESA_CONSUMER_KEY}:${env.MPESA_CONSUMER_SECRET}`,
          ).toString("base64")}`,
        },
        signal: AbortSignal.timeout(10_000),
      },
    );
  } catch {
    throw new MpesaProviderError(
      "MPESA_AUTH_FAILED",
      "Unable to authenticate with M-Pesa",
    );
  }

  const body = await readJson(response);
  const parsed = oauthResponseSchema.safeParse(body);

  if (!response.ok || !parsed.success) {
    throw new MpesaProviderError(
      "MPESA_AUTH_FAILED",
      "Unable to authenticate with M-Pesa",
      { httpStatus: response.status, ...safeProviderFields(body) },
    );
  }

  cachedToken = {
    token: parsed.data.access_token,
    refreshAt:
      Date.now() + Math.max(1, parsed.data.expires_in - 60) * 1_000,
  };
  return cachedToken.token;
}

function darajaTimestamp(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}${values.month}${values.day}${values.hour}${values.minute}${values.second}`;
}

export async function initiateMpesaStkPush(
  input: StkPushInput,
): Promise<StkPushResult> {
  const accessToken = await getMpesaAccessToken();
  const timestamp = darajaTimestamp();
  const password = Buffer.from(
    `${env.MPESA_SHORTCODE}${env.MPESA_PASSKEY}${timestamp}`,
  ).toString("base64");
  let response: Response;

  try {
    response = await fetch(mpesaUrl("/mpesa/stkpush/v1/processrequest"), {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: input.amountKes,
        PartyA: input.phoneNumber,
        PartyB: env.MPESA_SHORTCODE,
        PhoneNumber: input.phoneNumber,
        CallBackURL: env.MPESA_CALLBACK_URL,
        AccountReference: input.accountReference.slice(0, 12),
        TransactionDesc: "Ardhi access plan",
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new MpesaProviderError(
      "MPESA_STK_INITIATION_FAILED",
      "M-Pesa could not start the payment request",
    );
  }

  const body = await readJson(response);
  const parsed = stkResponseSchema.safeParse(body);

  if (!response.ok || !parsed.success || parsed.data.ResponseCode !== "0") {
    throw new MpesaProviderError(
      "MPESA_STK_INITIATION_FAILED",
      "M-Pesa could not start the payment request",
      { httpStatus: response.status, ...safeProviderFields(body) },
    );
  }

  return {
    merchantRequestId: parsed.data.MerchantRequestID,
    checkoutRequestId: parsed.data.CheckoutRequestID,
    responseCode: parsed.data.ResponseCode,
    responseDescription: parsed.data.ResponseDescription,
    customerMessage: parsed.data.CustomerMessage,
  };
}

export function clearMpesaTokenCache(): void {
  cachedToken = null;
}
