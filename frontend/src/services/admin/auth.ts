import { apiClient } from "../axiosConfig";
import type {
  AdminAuthResponse,
  AdminLoginRequest,
  AdminRegisterRequest,
} from "../../types/admin";
import type { RefreshTokenRequest, TokenResponse } from "../../types/auth";
import type { AdminUserResponse } from "../../types/admin";

export const loginAdmin = async (
  payload: AdminLoginRequest
): Promise<AdminAuthResponse> => {
  const { data } = await apiClient.post<AdminAuthResponse>(
    "/auth/admin/login",
    payload
  );
  return data;
};

export const registerAdmin = async (
  payload: AdminRegisterRequest,
  bootstrapSecret?: string
): Promise<AdminAuthResponse> => {
  const { data } = await apiClient.post<AdminAuthResponse>(
    "/auth/admin/register",
    payload,
    {
      headers: bootstrapSecret
        ? {
            "X-Admin-Bootstrap": bootstrapSecret,
          }
        : undefined,
    }
  );
  return data;
};

export const refreshAdminToken = async (
  payload: RefreshTokenRequest
): Promise<TokenResponse> => {
  const { data } = await apiClient.post<TokenResponse>(
    "/auth/admin/refresh",
    payload
  );
  return data;
};

export const logoutAdmin = async (): Promise<void> => {
  await apiClient.post("/auth/admin/logout");
};

export const getAdminMe = async (): Promise<AdminUserResponse> => {
  const { data } = await apiClient.get<AdminUserResponse>("/auth/admin/me");
  return data;
};
