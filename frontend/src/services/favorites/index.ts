import { apiClient } from "../axiosConfig";
import { buildQueryParams } from "../utils/queryParams";
import type { AddFavoriteRequest, FavoriteResponse, FavoriteType } from "../../types/favorites";
import type { PageResponse, Uuid } from "../../types/shared";

export type FavoritesListParams = {
  type?: FavoriteType;
  page?: number;
  size?: number;
};

export const getFavorites = async (
  params: FavoritesListParams = {}
): Promise<PageResponse<FavoriteResponse>> => {
  const { data } = await apiClient.get<PageResponse<FavoriteResponse>>(
    "/favorites",
    { params: buildQueryParams(params) }
  );
  return data;
};

export const addFavorite = async (
  payload: AddFavoriteRequest
): Promise<FavoriteResponse> => {
  const { data } = await apiClient.post<FavoriteResponse>("/favorites", payload);
  return data;
};

export const removeFavorite = async (params: {
  placeId?: Uuid;
  experienceId?: Uuid;
}): Promise<void> => {
  await apiClient.delete("/favorites", { params: buildQueryParams(params) });
};
