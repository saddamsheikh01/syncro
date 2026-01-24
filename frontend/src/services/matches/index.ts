import { apiClient } from "../axiosConfig";
import { buildQueryParams } from "../utils/queryParams";
import type {
  RecommendationResponse,
  RecommendationType,
  UserMatchResponse,
} from "../../types/matches";
import type { PageResponse } from "../../types/shared";

export type UserMatchesParams = {
  refresh?: boolean;
  page?: number;
  size?: number;
};

export type RecommendationsParams = {
  type?: RecommendationType;
  refresh?: boolean;
  page?: number;
  size?: number;
};

export const getUserMatches = async (
  params: UserMatchesParams = {}
): Promise<PageResponse<UserMatchResponse>> => {
  const { data } = await apiClient.get<PageResponse<UserMatchResponse>>(
    "/matches/users",
    { params: buildQueryParams(params) }
  );
  return data;
};

export const getMatchWithUser = async (
  userId: string
): Promise<UserMatchResponse> => {
  const { data } = await apiClient.get<UserMatchResponse>(
    `/matches/users/${userId}`
  );
  return data;
};

export const getRecommendations = async (
  params: RecommendationsParams = {}
): Promise<PageResponse<RecommendationResponse>> => {
  const { data } = await apiClient.get<PageResponse<RecommendationResponse>>(
    "/matches/places",
    { params: buildQueryParams(params) }
  );
  return data;
};
