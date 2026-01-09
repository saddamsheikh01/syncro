import type { IsoDateTime, Uuid } from "../shared";
import type { TagResponse } from "../tags";

export type CatalogSource = "MANUAL" | "API";

export type CategoryResponse = {
  id: Uuid;
  name: string;
  createdAt: IsoDateTime;
};

export type PlaceSummaryResponse = {
  id: Uuid;
  name: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  category: CategoryResponse | null;
  source: CatalogSource;
};

export type PlaceReferenceResponse = {
  id: Uuid;
  name: string;
  latitude: number | null;
  longitude: number | null;
};

export type AffiliationLinkResponse = {
  id: Uuid;
  url: string;
  provider: string | null;
  createdAt: IsoDateTime;
};

export type PlaceDetailResponse = {
  id: Uuid;
  name: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  category: CategoryResponse | null;
  source: CatalogSource;
  tags: TagResponse[];
  affiliationLinks: AffiliationLinkResponse[];
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export type ExperienceSummaryResponse = {
  id: Uuid;
  name: string;
  description: string | null;
  category: CategoryResponse | null;
  place: PlaceReferenceResponse | null;
  source: CatalogSource;
};

export type ExperienceDetailResponse = {
  id: Uuid;
  name: string;
  description: string | null;
  category: CategoryResponse | null;
  place: PlaceReferenceResponse | null;
  source: CatalogSource;
  tags: TagResponse[];
  affiliationLinks: AffiliationLinkResponse[];
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export type AdminCategoryRequest = {
  name: string;
};

export type AdminCategoryUpdateRequest = {
  name?: string | null;
};

export type AdminPlaceRequest = {
  name: string;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  categoryId?: Uuid | null;
  source?: CatalogSource | null;
  tagIds?: Uuid[] | null;
};

export type AdminPlaceUpdateRequest = {
  name?: string | null;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  categoryId?: Uuid | null;
  source?: CatalogSource | null;
  tagIds?: Uuid[] | null;
};

export type AdminExperienceRequest = {
  name: string;
  description?: string | null;
  categoryId?: Uuid | null;
  placeId?: Uuid | null;
  source?: CatalogSource | null;
  tagIds?: Uuid[] | null;
};

export type AdminExperienceUpdateRequest = {
  name?: string | null;
  description?: string | null;
  categoryId?: Uuid | null;
  placeId?: Uuid | null;
  source?: CatalogSource | null;
  tagIds?: Uuid[] | null;
};

export type AdminAffiliationLinkRequest = {
  url: string;
  provider?: string | null;
};

export type AdminAffiliationLinkUpdateRequest = {
  url?: string | null;
  provider?: string | null;
};
