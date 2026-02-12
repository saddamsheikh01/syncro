import { apiClient } from "../axiosConfig";
import type {
  AuthResponse,
  LoginRequest,
  PasswordResetConfirmRequest,
  PasswordResetRequest,
  PasswordResetRequestResponse,
  RefreshTokenRequest,
  RegisterRequest,
  TokenResponse,
  UserAdminAccessResponse,
  UserResponse,
} from "../../types/auth";

export const register = async (payload: RegisterRequest): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>("/auth/register", payload);
  return data;
};

export const login = async (payload: LoginRequest): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
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
