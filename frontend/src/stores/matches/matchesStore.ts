import type { ApiError } from "../../types/api";
import type {
  RecommendationResponse,
  UserMatchResponse,
} from "../../types/matches";
import type { PageResponse } from "../../types/shared";
import type {
  RecommendationsParams,
  UserMatchesParams,
} from "../../services/matches";
import { getRecommendations, getUserMatches, refreshUserMatch } from "../../services/matches";
import { createStore } from "../utils/createStore";
import type { PageInfo } from "../catalog/catalogStore";

const emptyPage: PageInfo = {
  page: 0,
  size: 0,
  totalPages: 0,
  totalElements: 0,
};

export type MatchesState = {
  userMatches: UserMatchResponse[];
  userMatchesPage: PageInfo;
  recommendations: RecommendationResponse[];
  recommendationsPage: PageInfo;
  loadingUserMatches: boolean;
  loadingRecommendations: boolean;
  error: ApiError | null;
};

const initialState: MatchesState = {
  userMatches: [],
  userMatchesPage: emptyPage,
  recommendations: [],
  recommendationsPage: emptyPage,
  loadingUserMatches: false,
  loadingRecommendations: false,
  error: null,
};

export const matchesStore = createStore<MatchesState>(initialState);

const mapPageInfo = (response: PageResponse<unknown>): PageInfo => ({
  page: response.number,
  size: response.size,
  totalPages: response.totalPages,
  totalElements: response.totalElements,
});

export const matchesActions = {
  fetchUserMatches: async (
    params: UserMatchesParams = {},
    options: { append?: boolean } = {}
  ): Promise<PageResponse<UserMatchResponse>> => {
    matchesStore.setState({ loadingUserMatches: true, error: null });

    try {
      const response = await getUserMatches(params);
      matchesStore.setState((state) => ({
        userMatches: options.append
          ? [...state.userMatches, ...response.content]
          : response.content,
        userMatchesPage: mapPageInfo(response),
        loadingUserMatches: false,
      }));
      return response;
    } catch (error) {
      matchesStore.setState({
        loadingUserMatches: false,
        error: error as ApiError,
      });
      throw error;
    }
  },

  fetchRecommendations: async (
    params: RecommendationsParams = {},
    options: { append?: boolean } = {}
  ): Promise<PageResponse<RecommendationResponse>> => {
    matchesStore.setState({ loadingRecommendations: true, error: null });

    try {
      const response = await getRecommendations(params);
      matchesStore.setState((state) => ({
        recommendations: options.append
          ? [...state.recommendations, ...response.content]
          : response.content,
        recommendationsPage: mapPageInfo(response),
        loadingRecommendations: false,
      }));
      return response;
    } catch (error) {
      matchesStore.setState({
        loadingRecommendations: false,
        error: error as ApiError,
      });
      throw error;
    }
  },

  refreshMatch: async (userId: string): Promise<UserMatchResponse> => {
    matchesStore.setState({ loadingUserMatches: true, error: null });

    try {
      const updatedMatch = await refreshUserMatch(userId);
      matchesStore.setState((state) => ({
        userMatches: state.userMatches.map((m) =>
          m.userId === userId ? updatedMatch : m
        ),
        loadingUserMatches: false,
      }));
      return updatedMatch;
    } catch (error) {
      matchesStore.setState({
        loadingUserMatches: false,
        error: error as ApiError,
      });
      throw error;
    }
  },
};
