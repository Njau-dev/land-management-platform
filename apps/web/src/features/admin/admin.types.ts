import type { UserRole, UserStatus } from "@/features/auth/auth.types";

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

export interface AdminAnalytics {
  totalUsers: number;
  activeSubscribers: number;
  usersWithoutActiveSubscription: number;
  successfulPayments: number;
  successfulPaymentRevenueKes: number;
  searchesToday: number;
  searchesThisMonth: number;
  totalTitleDeeds: number;
}

export interface AdminSubscriptionSummary {
  id: string;
  status: "ACTIVE";
  startsAt: string;
  endsAt: string;
  accessEndsAt: string;
  plan: {
    id: string;
    name: string;
    priceKes: number;
    interval: string;
    intervalCount: number;
  };
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt?: string;
  currentSubscription: AdminSubscriptionSummary | null;
}

export interface AdminPaymentSummary {
  id: string;
  amountKes: number;
  status: string;
  createdAt: string;
  completedAt: string | null;
  plan: { id: string; name: string };
}

export interface AdminUserDetail extends AdminUser {
  updatedAt: string;
  payments: AdminPaymentSummary[];
}

export interface TitleDeedSummary {
  id: string;
  titleDeedNumber: string;
  ownerName: string;
  location: string;
}

export interface AdminTitleDeed extends TitleDeedSummary {
  size: string;
  availabilityStatus: "AVAILABLE" | "SOLD" | "UNDER_TRANSACTION";
  landRate: string;
  createdAt: string;
  updatedAt: string;
  zoningInfo: { id: string; zoneType: string } | null;
  _count: { loansLiens: number; ownershipHistory: number };
}

export interface AdminZoning {
  id: string;
  titleDeedId: string;
  zoneType: string;
  notes: string | null;
  restrictions: string | null;
  createdAt: string;
  updatedAt: string;
  titleDeed: TitleDeedSummary;
}

export interface AdminLoan {
  id: string;
  titleDeedId: string;
  type: string;
  lender: string;
  amount: string;
  status: string;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  titleDeed: TitleDeedSummary;
}

export interface AdminOwnershipHistory {
  id: string;
  titleDeedId: string;
  ownerName: string;
  transferDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  titleDeed: TitleDeedSummary;
}

export type AdminResource =
  | "title-deeds"
  | "zoning"
  | "loans"
  | "ownership-history";

export type AdminRecord =
  | AdminTitleDeed
  | AdminZoning
  | AdminLoan
  | AdminOwnershipHistory;
