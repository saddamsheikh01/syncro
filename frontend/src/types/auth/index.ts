import type { IsoDateTime, Uuid } from "../shared";

export type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETED";
export type AuthProvider = "EMAIL" | "PHONE" | "GOOGLE";

export type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessExpiresIn: number;
  refreshExpiresIn: number;
};

export type UserResponse = {
  id: Uuid;
  email: string | null;
  username: string | null;
  language: string;
  onboardingCompleted: boolean;
  status: UserStatus;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export type AuthResponse = {
  user: UserResponse;
  tokens: TokenResponse;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  refCode?: string | null;
};

export type RefreshTokenRequest = {
  refreshToken: string;
};

export type UpdateUserRequest = {
  language?: string | null;
  onboardingCompleted?: boolean | null;
  username?: string | null;
};

export type UsernameAvailabilityResponse = {
  available: boolean;
};
