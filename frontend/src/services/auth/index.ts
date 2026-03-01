import { apiClient } from "../axiosConfig";
import type {
  AuthResponse,
  GoogleAuthRequest,
  LoginRequest,
  LoginResponse,
  PasswordResetConfirmRequest,
  PasswordResetRequest,
  PasswordResetRequestResponse,
  RefreshTokenRequest,
  RegisterRequest,
  RegisterResponse,
  TokenResponse,
  UserAdminAccessResponse,
  UserResponse,
} from "../../types/auth";

export const register = async (payload: RegisterRequest): Promise<RegisterResponse> => {
  const { data } = await apiClient.post<RegisterResponse>("/auth/register", payload);
  return data;
};

export const login = async (payload: LoginRequest): Promise<LoginResponse> => {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", payload);
  return data;
};

export const sendEmailVerificationOtp = async (email: string): Promise<void> => {
  await apiClient.post("/auth/email-verification/send-otp", { email });
};

export const verifyEmailOtp = async (
  email: string,
  otp: string
): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>(
    "/auth/email-verification/verify",
    { email, otp }
  );
  return data;
};

export const loginWithGoogle = async (
  payload: GoogleAuthRequest
): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>("/auth/google", payload);
  return data;
};

export const refreshToken = async (
  payload: RefreshTokenRequest
): Promise<TokenResponse> => {
  const { data } = await apiClient.post<TokenResponse>("/auth/refresh", payload);
  return data;
};

export const logout = async (): Promise<void> => {
  await apiClient.post("/auth/logout");
};

export const requestPasswordReset = async (
  payload: PasswordResetRequest
): Promise<PasswordResetRequestResponse> => {
  const { data } = await apiClient.post<PasswordResetRequestResponse>(
    "/auth/password/forgot",
    payload
  );
  return data;
};

export const confirmPasswordReset = async (
  payload: PasswordResetConfirmRequest
): Promise<void> => {
  await apiClient.post("/auth/password/reset", payload);
};

export const getMe = async (): Promise<UserResponse> => {
  const { data } = await apiClient.get<UserResponse>("/auth/me");
  return data;
};

export const getAdminAccess = async (): Promise<UserAdminAccessResponse> => {
  const { data } = await apiClient.get<UserAdminAccessResponse>(
    "/auth/admin-access"
  );
  return data;
};
