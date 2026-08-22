export const safePaymentSelect = {
  id: true,
  provider: true,
  amountKes: true,
  phoneNumber: true,
  status: true,
  resultCode: true,
  resultDescription: true,
  mpesaReceiptNumber: true,
  createdAt: true,
  completedAt: true,
  plan: {
    select: {
      id: true,
      name: true,
      priceKes: true,
      interval: true,
      intervalCount: true,
    },
  },
  subscription: {
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      status: true,
    },
  },
} as const;
