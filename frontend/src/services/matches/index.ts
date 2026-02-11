import { apiClient } from "../axiosConfig";
import { buildQueryParams } from "../utils/queryParams";
import type {
  MatchDomain,
  RecommendationResponse,
  RecommendationType,
  UserMatchResponse,
} from "../../types/matches";
import type { PageResponse } from "../../types/shared";

export type UserMatchesParams = {
  refresh?: boolean;
  page?: number;
  size?: number;
  domain?: MatchDomain;
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
  userId: string,
  params: { domain?: MatchDomain } = {}
): Promise<UserMatchResponse> => {
  const { data } = await apiClient.get<UserMatchResponse>(
    `/matches/users/${userId}`,
    { params: buildQueryParams(params) }
  );
  return data;
};

export const refreshUserMatch = async (
  userId: string,
  params: { domain?: MatchDomain } = {}
): Promise<UserMatchResponse> => {
  const { data } = await apiClient.post<UserMatchResponse>(
    `/matches/users/${userId}/refresh`,
    null,
    { params: buildQueryParams(params) }
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
