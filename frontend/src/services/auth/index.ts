import { apiClient } from "../axiosConfig";
import type {
  AuthResponse,
  LoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
  TokenResponse,
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

export const getMe = async (): Promise<UserResponse> => {
  const { data } = await apiClient.get<UserResponse>("/auth/me");
  return data;
};
