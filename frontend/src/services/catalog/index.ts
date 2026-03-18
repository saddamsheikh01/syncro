import { apiClient } from "../axiosConfig";
import { buildQueryParams } from "../utils/queryParams";
import type {
  CatalogResponse,
  CategoryResponse,
  ExperienceDetailResponse,
  ExperienceSummaryResponse,
  JobAcceptedResponse,
  PlaceDetailResponse,
  PlaceSummaryResponse,
} from "../../types/catalog";
import type { PageResponse, Uuid } from "../../types/shared";

/** Result of GET /experiences: either page data (200) or job accepted (202). */
export type GetExperiencesResult =
  | { type: "data"; data: PageResponse<ExperienceSummaryResponse> }
  | { type: "job"; job: JobAcceptedResponse };

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
  /** Preferred locale for experiences (e.g. en, it). Backend uses it for cache/job so language switch refetches instantly. */
  locale?: string;
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

/** Timeout for catalog request (unified places + experiences can be slow). */
const CATALOG_TIMEOUT_MS = 60_000;

/** Unified catalog: places and experiences in one request (All tab). */
export const getCatalog = async (
  params: CatalogSearchParams = {}
): Promise<CatalogResponse> => {
  const { data } = await apiClient.get<CatalogResponse>("/catalog", {
    params: buildQueryParams(params),
    timeout: CATALOG_TIMEOUT_MS,
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

/** Timeout for experiences (Viator can be slow). */
const EXPERIENCES_TIMEOUT_MS = 60_000;

/** GET /experiences. Returns data (200) or job accepted (202) for Viator nearby/search. */
export const getExperiences = async (
  params: CatalogSearchParams = {}
): Promise<GetExperiencesResult> => {
  const response = await apiClient.get<
    PageResponse<ExperienceSummaryResponse> | JobAcceptedResponse
  >("/experiences", {
    params: buildQueryParams(params),
    timeout: EXPERIENCES_TIMEOUT_MS,
    validateStatus: (status) => status === 200 || status === 202,
  });
  if (response.status === 202) {
    return { type: "job", job: response.data as JobAcceptedResponse };
  }
  return { type: "data", data: response.data as PageResponse<ExperienceSummaryResponse> };
};

/** GET /experiences/jobs/:jobId — status of a Viator fetch job (for polling after 202). */
export const getExperienceJobStatus = async (
  jobId: Uuid
): Promise<JobAcceptedResponse> => {
  const { data } = await apiClient.get<JobAcceptedResponse>(`/experiences/jobs/${jobId}`);
  return data;
};

const JOB_POLL_INTERVAL_MS = 3000; // 3 s between polls (worker picks up jobs within ~5 s)
const JOB_POLL_MAX_ATTEMPTS = 40;  // ~2 min total

/** Call getExperiences; on 202, poll job until COMPLETED/FAILED/NOT_FOUND then refetch. Returns page or throws. */
export const getExperiencesWithPolling = async (
  params: CatalogSearchParams = {}
): Promise<PageResponse<ExperienceSummaryResponse>> => {
  const first = await getExperiences(params);
  if (first.type === "data") return first.data;

  const { jobId } = first.job;
  for (let i = 0; i < JOB_POLL_MAX_ATTEMPTS; i++) {
    await new Promise((r) => setTimeout(r, JOB_POLL_INTERVAL_MS));
    const status = await getExperienceJobStatus(jobId);
    if (status.status === "COMPLETED") {
      const second = await getExperiences(params);
      if (second.type === "data") return second.data;
      if (second.type === "job") throw new Error("Please try again");
    }
    if (status.status === "FAILED") {
      throw new Error(status.message || "Fetch failed");
    }
    if (status.status === "NOT_FOUND") {
      const refetch = await getExperiences(params);
      if (refetch.type === "data") return refetch.data;
      throw new Error("Job no longer available; please try again");
    }
  }
  throw new Error("Job did not complete in time");
};

export const getExperience = async (
  experienceId: string
): Promise<ExperienceDetailResponse> => {
  const { data } = await apiClient.get<ExperienceDetailResponse>(
    `/experiences/${experienceId}`
  );
  return data;
};
