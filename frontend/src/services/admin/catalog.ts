import { apiClient } from "../axiosConfig";
import { buildQueryParams } from "../utils/queryParams";
import type {
  AdminAffiliationLinkRequest,
  AdminAffiliationLinkUpdateRequest,
  AdminCategoryRequest,
  AdminCategoryUpdateRequest,
  AdminExperienceRequest,
  AdminExperienceUpdateRequest,
  AdminPlaceRequest,
  AdminPlaceUpdateRequest,
  AffiliationLinkResponse,
  CategoryResponse,
  ExperienceDetailResponse,
  ExperienceSummaryResponse,
  PlaceDetailResponse,
  PlaceSummaryResponse,
} from "../../types/catalog";
import type { PageResponse, Uuid } from "../../types/shared";

export type AdminCatalogSearchParams = {
  categoryId?: Uuid;
  tagIds?: Uuid[];
  lat?: number;
  lng?: number;
  radiusKm?: number;
  q?: string;
  page?: number;
  size?: number;
};

export type AdminCategoryListParams = {
  page?: number;
  size?: number;
};

export const getAdminCategories = async (
  params: AdminCategoryListParams = {}
): Promise<PageResponse<CategoryResponse>> => {
  const { data } = await apiClient.get<PageResponse<CategoryResponse>>(
    "/admin/categories",
    { params: buildQueryParams(params) }
  );
  return data;
};

export const createAdminCategory = async (
  payload: AdminCategoryRequest
): Promise<CategoryResponse> => {
  const { data } = await apiClient.post<CategoryResponse>(
    "/admin/categories",
    payload
  );
  return data;
};

export const updateAdminCategory = async (
  categoryId: Uuid,
  payload: AdminCategoryUpdateRequest
): Promise<CategoryResponse> => {
  const { data } = await apiClient.put<CategoryResponse>(
    `/admin/categories/${categoryId}`,
    payload
  );
  return data;
};

export const deleteAdminCategory = async (categoryId: Uuid): Promise<void> => {
  await apiClient.delete(`/admin/categories/${categoryId}`);
};

export const getAdminPlaces = async (
  params: AdminCatalogSearchParams = {}
): Promise<PageResponse<PlaceSummaryResponse>> => {
  const { data } = await apiClient.get<PageResponse<PlaceSummaryResponse>>(
    "/admin/places",
    { params: buildQueryParams(params) }
  );
  return data;
};

export const getAdminPlace = async (
  placeId: Uuid
): Promise<PlaceDetailResponse> => {
  const { data } = await apiClient.get<PlaceDetailResponse>(
    `/admin/places/${placeId}`
  );
  return data;
};

export const createAdminPlace = async (
  payload: AdminPlaceRequest
): Promise<PlaceDetailResponse> => {
  const { data } = await apiClient.post<PlaceDetailResponse>(
    "/admin/places",
    payload
  );
  return data;
};

export const updateAdminPlace = async (
  placeId: Uuid,
  payload: AdminPlaceUpdateRequest
): Promise<PlaceDetailResponse> => {
  const { data } = await apiClient.put<PlaceDetailResponse>(
    `/admin/places/${placeId}`,
    payload
  );
  return data;
};

export const deleteAdminPlace = async (placeId: Uuid): Promise<void> => {
  await apiClient.delete(`/admin/places/${placeId}`);
};

export const getPlaceAffiliations = async (
  placeId: Uuid
): Promise<AffiliationLinkResponse[]> => {
  const { data } = await apiClient.get<AffiliationLinkResponse[]>(
    `/admin/places/${placeId}/affiliations`
  );
  return data;
};

export const createPlaceAffiliation = async (
  placeId: Uuid,
  payload: AdminAffiliationLinkRequest
): Promise<AffiliationLinkResponse> => {
  const { data } = await apiClient.post<AffiliationLinkResponse>(
    `/admin/places/${placeId}/affiliations`,
    payload
  );
  return data;
};

export const updatePlaceAffiliation = async (
  placeId: Uuid,
  affiliationId: Uuid,
  payload: AdminAffiliationLinkUpdateRequest
): Promise<AffiliationLinkResponse> => {
  const { data } = await apiClient.put<AffiliationLinkResponse>(
    `/admin/places/${placeId}/affiliations/${affiliationId}`,
    payload
  );
  return data;
};

export const deletePlaceAffiliation = async (
  placeId: Uuid,
  affiliationId: Uuid
): Promise<void> => {
  await apiClient.delete(
    `/admin/places/${placeId}/affiliations/${affiliationId}`
  );
};

export const getAdminExperiences = async (
  params: AdminCatalogSearchParams = {}
): Promise<PageResponse<ExperienceSummaryResponse>> => {
  const { data } = await apiClient.get<PageResponse<ExperienceSummaryResponse>>(
    "/admin/experiences",
    { params: buildQueryParams(params) }
  );
  return data;
};

export const getAdminExperience = async (
  experienceId: Uuid
): Promise<ExperienceDetailResponse> => {
  const { data } = await apiClient.get<ExperienceDetailResponse>(
    `/admin/experiences/${experienceId}`
  );
  return data;
};

export const createAdminExperience = async (
  payload: AdminExperienceRequest
): Promise<ExperienceDetailResponse> => {
  const { data } = await apiClient.post<ExperienceDetailResponse>(
    "/admin/experiences",
    payload
  );
  return data;
};

export const updateAdminExperience = async (
  experienceId: Uuid,
  payload: AdminExperienceUpdateRequest
): Promise<ExperienceDetailResponse> => {
  const { data } = await apiClient.put<ExperienceDetailResponse>(
    `/admin/experiences/${experienceId}`,
    payload
  );
  return data;
};

export const deleteAdminExperience = async (
  experienceId: Uuid
): Promise<void> => {
  await apiClient.delete(`/admin/experiences/${experienceId}`);
};

export const getExperienceAffiliations = async (
  experienceId: Uuid
): Promise<AffiliationLinkResponse[]> => {
  const { data } = await apiClient.get<AffiliationLinkResponse[]>(
    `/admin/experiences/${experienceId}/affiliations`
  );
  return data;
};

export const createExperienceAffiliation = async (
  experienceId: Uuid,
  payload: AdminAffiliationLinkRequest
): Promise<AffiliationLinkResponse> => {
  const { data } = await apiClient.post<AffiliationLinkResponse>(
    `/admin/experiences/${experienceId}/affiliations`,
    payload
  );
  return data;
};

export const updateExperienceAffiliation = async (
  experienceId: Uuid,
  affiliationId: Uuid,
  payload: AdminAffiliationLinkUpdateRequest
): Promise<AffiliationLinkResponse> => {
  const { data } = await apiClient.put<AffiliationLinkResponse>(
    `/admin/experiences/${experienceId}/affiliations/${affiliationId}`,
    payload
  );
  return data;
};

export const deleteExperienceAffiliation = async (
  experienceId: Uuid,
  affiliationId: Uuid
): Promise<void> => {
  await apiClient.delete(
    `/admin/experiences/${experienceId}/affiliations/${affiliationId}`
  );
};
