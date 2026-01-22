import { apiClient } from "../axiosConfig";
import type { UpdateUserRequest, UserResponse } from "../../types/auth";
import type { UserSummaryResponse } from "../../types/profile";
import type { PageResponse } from "../../types/shared";

export type UserSearchParams = {
  q: string;
  page?: number;
  size?: number;
};

export const getCurrentUser = async (): Promise<UserResponse> => {
  const { data } = await apiClient.get<UserResponse>("/users/me");
  return data;
};

export const updateCurrentUser = async (
  payload: UpdateUserRequest
): Promise<UserResponse> => {
  const { data } = await apiClient.patch<UserResponse>("/users/me", payload);
  return data;
};

export const getUserSummary = async (
  userId: string
): Promise<UserSummaryResponse> => {
  const { data } = await apiClient.get<UserSummaryResponse>(
    `/users/${userId}/summary`
  );
  return data;
};

export const searchUsers = async (
  params: UserSearchParams
): Promise<PageResponse<UserSummaryResponse>> => {
  const { data } = await apiClient.get<PageResponse<UserSummaryResponse>>(
    "/profile/search",
    { params }
  );
  return data;
};
