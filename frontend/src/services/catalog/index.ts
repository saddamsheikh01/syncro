import { apiClient } from "../axiosConfig";
import { buildQueryParams } from "../utils/queryParams";
import type {
  CatalogResponse,
  CategoryResponse,
  ExperienceDetailResponse,
  ExperienceSummaryResponse,
  PlaceDetailResponse,
  PlaceSummaryResponse,
} from "../../types/catalog";
import type { PageResponse, Uuid } from "../../types/shared";

export type CategoryListParams = {
  page?: number;
  size?: number;
};

export type CatalogSource = "MANUAL" | "API" | "GOOGLE" | "GETYOURGUIDE" | "VIATOR" | "MUSEMENT" | "CIVITATIS" | "TIQETS";

export type CatalogSearchParams = {
  categoryId?: Uuid;
  tagIds?: Uuid[];
  googleTypes?: string[];
  openNow?: boolean;
  minRating?: number;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  q?: string;
  source?: CatalogSource;
  page?: number;
  size?: number;
};

export const getCategories = async (
  params: CategoryListParams = {}
): Promise<PageResponse<CategoryResponse>> => {
  const { data } = await apiClient.get<PageResponse<CategoryResponse>>(
    "/categories",
    {
      params: buildQueryParams(params),
    }
  );
  return data;
};

/** Unified catalog: places and experiences in one request (All tab). */
export const getCatalog = async (
  params: CatalogSearchParams = {}
): Promise<CatalogResponse> => {
  const { data } = await apiClient.get<CatalogResponse>("/catalog", {
    params: buildQueryParams(params),
  });
  return data;
};

export const getPlaces = async (
  params: CatalogSearchParams = {}
): Promise<PageResponse<PlaceSummaryResponse>> => {
  const { data } = await apiClient.get<PageResponse<PlaceSummaryResponse>>(
    "/places",
    {
      params: buildQueryParams(params),
    }
  );
  return data;
};

export const getPlace = async (placeId: Uuid): Promise<PlaceDetailResponse> => {
  const { data } = await apiClient.get<PlaceDetailResponse>(`/places/${placeId}`);
  return data;
};

export const getExperiences = async (
  params: CatalogSearchParams = {}
): Promise<PageResponse<ExperienceSummaryResponse>> => {
  const { data } = await apiClient.get<PageResponse<ExperienceSummaryResponse>>(
    "/experiences",
    {
      params: buildQueryParams(params),
    }
  );
  return data;
};

export const getExperience = async (
  experienceId: string
): Promise<ExperienceDetailResponse> => {
  const { data } = await apiClient.get<ExperienceDetailResponse>(
    `/experiences/${experienceId}`
  );
  return data;
};
