import type { IsoDateTime, Uuid } from "../shared";
import type { TagResponse } from "../tags";

export type CatalogSource =
  | "MANUAL"
  | "API"
  | "GETYOURGUIDE"
  | "VIATOR"
  | "MUSEMENT"
  | "CIVITATIS"
  | "TIQETS";

export type ExperienceProvider =
  | "GETYOURGUIDE"
  | "VIATOR"
  | "MUSEMENT"
  | "CIVITATIS"
  | "TIQETS"
  | "OTHER";

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
  // Provider esterni
  provider: ExperienceProvider | null;
  imageUrl: string | null;
  price: number | null;
  priceCurrency: string | null;
  originalPrice: number | null;
  durationMinutes: number | null;
  rating: number | null;
  reviewCount: number | null;
  locationName: string | null;
  isActive: boolean;
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
  // Provider esterni
  provider: ExperienceProvider | null;
  externalId: string | null;
  price: number | null;
  priceCurrency: string | null;
  originalPrice: number | null;
  durationMinutes: number | null;
  imageUrl: string | null;
  images: string[];
  bookingUrl: string | null;
  rating: number | null;
  reviewCount: number | null;
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  languages: string[];
  cancellationPolicy: string | null;
  meetingPoint: string | null;
  minParticipants: number | null;
  maxParticipants: number | null;
  lastSyncedAt: IsoDateTime | null;
  isActive: boolean;
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
  // Provider esterni
  provider?: ExperienceProvider | null;
  externalId?: string | null;
  price?: number | null;
  priceCurrency?: string | null;
  originalPrice?: number | null;
  durationMinutes?: number | null;
  imageUrl?: string | null;
  images?: string[] | null;
  bookingUrl?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string | null;
  highlights?: string[] | null;
  inclusions?: string[] | null;
  exclusions?: string[] | null;
  languages?: string[] | null;
  cancellationPolicy?: string | null;
  meetingPoint?: string | null;
  minParticipants?: number | null;
  maxParticipants?: number | null;
  isActive?: boolean | null;
};

export type AdminExperienceUpdateRequest = {
  name?: string | null;
  description?: string | null;
  categoryId?: Uuid | null;
  placeId?: Uuid | null;
  source?: CatalogSource | null;
  tagIds?: Uuid[] | null;
  // Provider esterni
  provider?: ExperienceProvider | null;
  externalId?: string | null;
  price?: number | null;
  priceCurrency?: string | null;
  originalPrice?: number | null;
  durationMinutes?: number | null;
  imageUrl?: string | null;
  images?: string[] | null;
  bookingUrl?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string | null;
  highlights?: string[] | null;
  inclusions?: string[] | null;
  exclusions?: string[] | null;
  languages?: string[] | null;
  cancellationPolicy?: string | null;
  meetingPoint?: string | null;
  minParticipants?: number | null;
  maxParticipants?: number | null;
  isActive?: boolean | null;
};

export type AdminAffiliationLinkRequest = {
  url: string;
  provider?: string | null;
};

export type AdminAffiliationLinkUpdateRequest = {
  url?: string | null;
  provider?: string | null;
};
