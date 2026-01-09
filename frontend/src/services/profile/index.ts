import { apiClient } from "../axiosConfig";
import type {
  UserPositionRequest,
  UserPositionResponse,
  UserPreferencesRequest,
  UserPreferencesResponse,
  UserProfileRequest,
  UserProfileResponse,
} from "../../types/profile";

export const getProfile = async (): Promise<UserProfileResponse> => {
  const { data } = await apiClient.get<UserProfileResponse>("/profile");
  return data;
};

export const upsertProfile = async (
  payload: UserProfileRequest
): Promise<UserProfileResponse> => {
  const { data } = await apiClient.put<UserProfileResponse>("/profile", payload);
  return data;
};

export const getPreferences = async (): Promise<UserPreferencesResponse> => {
  const { data } = await apiClient.get<UserPreferencesResponse>("/preferences");
  return data;
};

export const upsertPreferences = async (
  payload: UserPreferencesRequest
): Promise<UserPreferencesResponse> => {
  const { data } = await apiClient.put<UserPreferencesResponse>(
    "/preferences",
    payload
  );
  return data;
};

export const getPosition = async (): Promise<UserPositionResponse> => {
  const { data } = await apiClient.get<UserPositionResponse>("/positions");
  return data;
};

export const upsertPosition = async (
  payload: UserPositionRequest
): Promise<UserPositionResponse> => {
  const { data } = await apiClient.put<UserPositionResponse>(
    "/positions",
    payload
  );
  return data;
};
