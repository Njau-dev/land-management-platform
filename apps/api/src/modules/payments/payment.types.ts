export interface MpesaConfirmationInput {
  checkoutRequestId: string;
  merchantRequestId?: string;
  resultCode: number;
  resultDescription: string;
  mpesaReceiptNumber?: string;
  amountKes?: number;
  phoneNumber?: string;
  providerMetadata?: Record<string, unknown>;
}
