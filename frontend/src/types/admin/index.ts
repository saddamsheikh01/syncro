import type { IsoDateTime, Uuid } from "../shared";
import type { TokenResponse, UserStatus } from "../auth";

export type AdminStatus = "ACTIVE" | "SUSPENDED";
export type AdminRole = "ADMIN" | "SUPER_ADMIN";

export type AdminUserResponse = {
  id: Uuid;
  email: string;
  role: AdminRole;
  status: AdminStatus;
  lastLogin: IsoDateTime | null;
  createdAt: IsoDateTime;
};

export type AdminAuthResponse = {
  admin: AdminUserResponse;
  tokens: TokenResponse;
};

export type AdminLoginRequest = {
  email: string;
  password: string;
};

export type AdminRegisterRequest = {
  email: string;
  password: string;
  role: AdminRole;
};

export type AdminCreateAdminRequest = {
  email: string;
  password: string;
};

export type AdminUpdateAdminRequest = {
  status?: AdminStatus | null;
};

export type AdminCreateUserRequest = {
  email: string;
  password: string;
  language: string;
};

export type AdminUpdateUserRequest = {
  language?: string | null;
  onboardingCompleted?: boolean | null;
  status?: UserStatus | null;
};
