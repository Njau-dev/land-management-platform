import type {
  UserRole,
  UserStatus,
} from "../../../generated/prisma/client.js";

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export interface AuthIdentity {
  userId: string;
  role: UserRole;
}

export interface AuthSessionResult {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}
