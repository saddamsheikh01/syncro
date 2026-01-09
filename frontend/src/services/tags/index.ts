import { apiClient } from "../axiosConfig";
import type {
  TagListResponse,
  UpdateUserInterestsRequest,
  UserInterestsResponse,
} from "../../types/tags";

export const getTags = async (): Promise<TagListResponse> => {
  const { data } = await apiClient.get<TagListResponse>("/tags");
  return data;
};

export const getUserInterests = async (): Promise<UserInterestsResponse> => {
  const { data } = await apiClient.get<UserInterestsResponse>(
    "/users/me/interests"
  );
  return data;
};

export const updateUserInterests = async (
  payload: UpdateUserInterestsRequest
): Promise<UserInterestsResponse> => {
  const { data } = await apiClient.put<UserInterestsResponse>(
    "/users/me/interests",
    payload
  );
  return data;
};
