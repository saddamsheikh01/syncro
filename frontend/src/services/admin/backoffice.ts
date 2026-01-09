import { apiClient } from "../axiosConfig";
import { buildQueryParams } from "../utils/queryParams";
import type {
  AdminCreateAdminRequest,
  AdminCreateUserRequest,
  AdminUpdateAdminRequest,
  AdminUpdateUserRequest,
  AdminUserResponse,
  AdminRole,
  AdminStatus,
} from "../../types/admin";
import type { UserResponse, UserStatus } from "../../types/auth";
import type { PageResponse, Uuid } from "../../types/shared";

export type AdminUsersParams = {
  email?: string;
  status?: UserStatus;
  onboardingCompleted?: boolean;
  page?: number;
  size?: number;
};

export type AdminAdminsParams = {
  email?: string;
  status?: AdminStatus;
  role?: AdminRole;
  page?: number;
  size?: number;
};

export const getUsers = async (
  params: AdminUsersParams = {}
): Promise<PageResponse<UserResponse>> => {
  const { data } = await apiClient.get<PageResponse<UserResponse>>(
    "/admin/users",
    { params: buildQueryParams(params) }
  );
  return data;
};

export const getUser = async (userId: Uuid): Promise<UserResponse> => {
  const { data } = await apiClient.get<UserResponse>(`/admin/users/${userId}`);
  return data;
};

export const createUser = async (
  payload: AdminCreateUserRequest
): Promise<UserResponse> => {
  const { data } = await apiClient.post<UserResponse>("/admin/users", payload);
  return data;
};

export const updateUser = async (
  userId: Uuid,
  payload: AdminUpdateUserRequest
): Promise<UserResponse> => {
  const { data } = await apiClient.patch<UserResponse>(
    `/admin/users/${userId}`,
    payload
  );
  return data;
};

export const deleteUser = async (userId: Uuid): Promise<void> => {
  await apiClient.delete(`/admin/users/${userId}`);
};

export const getAdminUsers = async (
  params: AdminAdminsParams = {}
): Promise<PageResponse<AdminUserResponse>> => {
  const { data } = await apiClient.get<PageResponse<AdminUserResponse>>(
    "/admin/admin-users",
    { params: buildQueryParams(params) }
  );
  return data;
};

export const getAdminUser = async (adminId: Uuid): Promise<AdminUserResponse> => {
  const { data } = await apiClient.get<AdminUserResponse>(
    `/admin/admin-users/${adminId}`
  );
  return data;
};

export const createAdmin = async (
  payload: AdminCreateAdminRequest
): Promise<AdminUserResponse> => {
  const { data } = await apiClient.post<AdminUserResponse>(
    "/admin/admin-users",
    payload
  );
  return data;
};

export const updateAdmin = async (
  adminId: Uuid,
  payload: AdminUpdateAdminRequest
): Promise<AdminUserResponse> => {
  const { data } = await apiClient.patch<AdminUserResponse>(
    `/admin/admin-users/${adminId}`,
    payload
  );
  return data;
};

export const deleteAdmin = async (adminId: Uuid): Promise<void> => {
  await apiClient.delete(`/admin/admin-users/${adminId}`);
};
