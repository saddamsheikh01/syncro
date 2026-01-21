import { apiClient } from "../axiosConfig";
import type { UpdateUserRequest, UserResponse } from "../../types/auth";
import type { UserSummaryResponse } from "../../types/profile";

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
