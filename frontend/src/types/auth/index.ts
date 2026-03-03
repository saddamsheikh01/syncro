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
  phone: string | null;
  username: string | null;
  language: string;
  onboardingCompleted: boolean;
  emailVerified: boolean;
  status: UserStatus;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export type AuthResponse = {
  user: UserResponse;
  tokens: TokenResponse;
};

export type RequiresVerificationResponse = {
  email: string;
  requiresVerification: boolean;
};

export type RegisterResponse = {
  authResponse: AuthResponse | null;
  requiresVerification: RequiresVerificationResponse | null;
};

export type LoginResponse = {
  authResponse: AuthResponse | null;
  requiresVerification: RequiresVerificationResponse | null;
};

export type UpdateUserResponse = {
  user: UserResponse | null;
  requiresVerification: RequiresVerificationResponse | null;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  phone?: string | null;
  refCode?: string | null;
  language?: string | null;
};

export type RefreshTokenRequest = {
  refreshToken: string;
};

export type GoogleAuthRequest = {
  idToken: string;
  refCode?: string | null;
  language?: string | null;
};

export type PasswordResetRequest = {
  email: string;
};

export type PasswordResetRequestResponse = {
  message: string;
};

export type PasswordResetConfirmRequest = {
  token: string;
  newPassword: string;
};

export type UpdateUserRequest = {
  language?: string | null;
  username?: string | null;
  phone?: string | null;
  email?: string | null;
};

export type UsernameAvailabilityResponse = {
  available: boolean;
};

export type DeleteCurrentUserRequest = {
  confirmationPhrase: string;
};

export type UserAdminAccessResponse = {
  superAdmin: boolean;
};
