import type { IsoDate, IsoDateTime, JsonObject, Uuid } from "../shared";

export type ProfileVisibility = "PUBLIC" | "PARTIAL" | "PRIVATE";

export type UserProfileRequest = {
  fullName?: string | null;
  birthDate?: IsoDate | null;
  city?: string | null;
  country?: string | null;
  jobTitle?: string | null;
  companyName?: string | null;
  bio?: string | null;
  visibility?: ProfileVisibility | null;
};

export type UserProfileResponse = {
  id: Uuid;
  userId: Uuid;
  fullName: string | null;
  birthDate: IsoDate | null;
  age: number | null;
  city: string | null;
  country: string | null;
  jobTitle: string | null;
  companyName: string | null;
  bio: string | null;
  visibility: ProfileVisibility;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export type UserPreferencesRequest = {
  matchmakingFilters?: JsonObject | null;
  feedPreferences?: JsonObject | null;
  privacyPolicyAccepted?: boolean | null;
  newsletterConsent?: boolean | null;
};

export type UserPreferencesResponse = {
  id: Uuid;
  userId: Uuid;
  matchmakingFilters: JsonObject;
  feedPreferences: JsonObject;
  privacyPolicyAccepted: boolean;
  privacyPolicyAcceptedAt: IsoDateTime | null;
  newsletterConsent: boolean;
  newsletterConsentAt: IsoDateTime | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export type UserPositionRequest = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number | null;
};

export type UserPositionResponse = {
  userId: Uuid;
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  updatedAt: IsoDateTime;
};

export type UserSummaryResponse = {
  userId: Uuid;
  fullName: string | null;
  city: string | null;
  country: string | null;
  avatarUrl: string | null;
  visibility: ProfileVisibility | null;
};

export type UserPublicProfileResponse = {
  userId: Uuid;
  fullName: string | null;
  age: number | null;
  city: string | null;
  country: string | null;
  jobTitle: string | null;
  companyName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  visibility: ProfileVisibility | null;
};
