import { apiClient } from "../axiosConfig";
import type {
  AdminLanguageResponse,
  AdminAuthResponse,
  AdminLoginRequest,
  AdminRegisterRequest,
  AdminUpdateLanguageRequest,
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

export const getAdminLanguage = async (): Promise<AdminLanguageResponse> => {
  const { data } = await apiClient.get<AdminLanguageResponse>(
    "/auth/admin/language"
  );
  return data;
};

export const updateAdminLanguage = async (
  payload: AdminUpdateLanguageRequest
): Promise<AdminLanguageResponse> => {
  const { data } = await apiClient.patch<AdminLanguageResponse>(
    "/auth/admin/language",
    payload
  );
  return data;
};
