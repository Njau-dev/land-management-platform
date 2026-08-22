import type { RequestHandler } from "express";

import { AppError } from "../../utils/app-error.js";
import { parseMpesaCallback } from "./payment.callback.js";
import { completeMpesaPayment } from "./payment.confirmation.js";
import type {
  InitiatePaymentInput,
  MpesaCallbackBody,
} from "./payment.schemas.js";
import {
  getPaymentStatus,
  initiatePayment,
  listPaymentHistory,
} from "./payment.service.js";

function currentUserId(request: Parameters<RequestHandler>[0]): string {
  if (!request.currentUser) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  }

  return request.currentUser.id;
}

export const initiatePaymentController: RequestHandler = async (
  request,
  response,
) => {
  const payment = await initiatePayment(
    currentUserId(request),
    request.body as InitiatePaymentInput,
  );
  response.status(201).json({ payment });
};

export const mpesaCallbackController: RequestHandler = async (
  request,
  response,
) => {
  const confirmation = parseMpesaCallback(request.body as MpesaCallbackBody);
  const payment = await completeMpesaPayment(confirmation);

  if (!payment) {
    throw new AppError(404, "PAYMENT_NOT_FOUND", "Payment not found");
  }

  response.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
};

export const getPaymentStatusController: RequestHandler = async (
  request,
  response,
) => {
  const paymentId = request.params["paymentId"];
  const payment = await getPaymentStatus(
    currentUserId(request),
    typeof paymentId === "string" ? paymentId : "",
  );
  response.status(200).json({ payment });
};

export const listPaymentsController: RequestHandler = async (
  request,
  response,
) => {
  const payments = await listPaymentHistory(currentUserId(request));
  response.status(200).json({ payments });
};
