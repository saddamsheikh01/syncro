import { apiClient } from "../axiosConfig";
import { buildQueryParams } from "../utils/queryParams";
import type { QueryValue } from "../utils/queryParams";
import type { UserMatchResponse } from "@/types/matches";
import type { PageResponse } from "@/types/shared";

export type PeopleContext =
  | "WORK"
  | "PROJECTS"
  | "FRIENDSHIP"
  | "HOBBY"
  | "GROWTH"
  | "LOVE";

export type PeopleParams = {
  q?: string;
  city?: string;
  country?: string;
  ageMin?: number;
  ageMax?: number;
  gender?: string;
  orientation?: string;
  zodiacSign?: string;
  interestTagIds?: string[];
  interestTagIdsCsv?: string;
  valuesText?: string;
  context?: PeopleContext;
  latitude?: number;
  longitude?: number;
  maxDistanceKm?: number;
  sort?: "compatibility" | "recently_active";
  page?: number;
  size?: number;
};

export const getPeople = async (
  params: PeopleParams = {}
): Promise<PageResponse<UserMatchResponse>> => {
  const { data } = await apiClient.get<PageResponse<UserMatchResponse>>(
    "/people",
    {
      params,
      paramsSerializer: (p) =>
        buildQueryParams((p ?? {}) as Record<string, QueryValue | QueryValue[]>).toString(),
    }
  );
  return data;
};
