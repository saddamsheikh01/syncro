import { apiClient } from "../axiosConfig";
import type {
  UpdateUserRequest,
  UserResponse,
  UsernameAvailabilityResponse,
} from "../../types/auth";
import type {
  UserPublicProfileResponse,
  UserSummaryResponse,
} from "../../types/profile";
import type { PostResponse } from "../../types/social";
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

export const checkUsernameAvailability = async (
  username: string
): Promise<UsernameAvailabilityResponse> => {
  const { data } = await apiClient.get<UsernameAvailabilityResponse>(
    "/users/username-availability",
    { params: { username } }
  );
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

export const getUserProfile = async (
  userId: string
): Promise<UserPublicProfileResponse> => {
  const { data } = await apiClient.get<UserPublicProfileResponse>(
    `/users/${userId}/profile`
  );
  return data;
};

export const getUserPosts = async (
  userId: string,
  params: { page?: number; size?: number } = {}
): Promise<PageResponse<PostResponse>> => {
  const { data } = await apiClient.get<PageResponse<PostResponse>>(
    `/users/${userId}/posts`,
    { params }
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
