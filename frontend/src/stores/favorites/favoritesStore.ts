import type { ApiError } from "../../types/api";
import type { FavoriteResponse } from "../../types/favorites";
import type { PageResponse, Uuid } from "../../types/shared";
import type { FavoritesListParams } from "../../services/favorites";
import { addFavorite, getFavorites, removeFavorite } from "../../services/favorites";
import type { AddFavoriteRequest } from "../../types/favorites";
import { createStore } from "../utils/createStore";
import type { PageInfo } from "../catalog/catalogStore";

const emptyPage: PageInfo = {
  page: 0,
  size: 0,
  totalPages: 0,
  totalElements: 0,
};

export type FavoritesState = {
  items: FavoriteResponse[];
  pageInfo: PageInfo;
  filters: FavoritesListParams;
  loading: boolean;
  error: ApiError | null;
};

const initialState: FavoritesState = {
  items: [],
  pageInfo: emptyPage,
  filters: {},
  loading: false,
  error: null,
};

export const favoritesStore = createStore<FavoritesState>(initialState);

const mapPageInfo = (response: PageResponse<unknown>): PageInfo => ({
  page: response.number,
  size: response.size,
  totalPages: response.totalPages,
  totalElements: response.totalElements,
});

const matchesFavorite = (
  favorite: FavoriteResponse,
  params: { placeId?: Uuid; experienceId?: Uuid; postId?: Uuid }
) => {
  if (params.placeId) {
    return favorite.place?.id === params.placeId;
  }
  if (params.experienceId) {
    return favorite.experience?.id === params.experienceId;
  }
  if (params.postId) {
    return favorite.post?.id === params.postId;
  }
  return false;
};

export const favoritesActions = {
  setFilters: (filters: FavoritesListParams) => {
    favoritesStore.setState({ filters });
  },

  fetchFavorites: async (
    params: FavoritesListParams = {},
    options: { append?: boolean } = {}
  ): Promise<PageResponse<FavoriteResponse>> => {
    favoritesStore.setState({ loading: true, error: null, filters: params });

    try {
      const response = await getFavorites(params);
      favoritesStore.setState((state) => ({
        items: options.append
          ? [...state.items, ...response.content]
          : response.content,
        pageInfo: mapPageInfo(response),
        loading: false,
      }));
      return response;
    } catch (error) {
      favoritesStore.setState({ loading: false, error: error as ApiError });
      throw error;
    }
  },

  addFavorite: async (payload: AddFavoriteRequest): Promise<FavoriteResponse> => {
    favoritesStore.setState({ loading: true, error: null });

    try {
      const response = await addFavorite(payload);
      favoritesStore.setState((state) => ({
        items: [response, ...state.items],
        loading: false,
      }));
      return response;
    } catch (error) {
      favoritesStore.setState({ loading: false, error: error as ApiError });
      throw error;
    }
  },

  removeFavorite: async (params: {
    placeId?: Uuid;
    experienceId?: Uuid;
    postId?: Uuid;
  }): Promise<void> => {
    favoritesStore.setState({ loading: true, error: null });

    try {
      await removeFavorite(params);
      favoritesStore.setState((state) => {
        const items = state.items.filter((favorite) => !matchesFavorite(favorite, params));
        const totalElements = Math.max(0, state.pageInfo.totalElements - 1);
        const totalPages =
          state.pageInfo.size > 0
            ? Math.ceil(totalElements / state.pageInfo.size)
            : state.pageInfo.totalPages;
        const page =
          totalPages > 0
            ? Math.min(state.pageInfo.page, totalPages - 1)
            : 0;

        return {
          items,
          pageInfo: {
            ...state.pageInfo,
            totalElements,
            totalPages,
            page,
          },
          loading: false,
        };
      });
    } catch (error) {
      favoritesStore.setState({ loading: false, error: error as ApiError });
      throw error;
    }
  },
};
