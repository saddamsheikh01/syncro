import type { IsoDateTime, JsonObject, Uuid } from "../shared";
import type { TokenResponse, UserStatus } from "../auth";

export type AdminStatus = "ACTIVE" | "SUSPENDED";
export type AdminRole = "ADMIN" | "SUPER_ADMIN";

export type AdminUserResponse = {
  id: Uuid;
  email: string;
  role: AdminRole;
  status: AdminStatus;
  lastLogin: IsoDateTime | null;
  createdAt: IsoDateTime;
};

export type AdminAuthResponse = {
  admin: AdminUserResponse;
  tokens: TokenResponse;
};

export type AdminLoginRequest = {
  email: string;
  password: string;
};

export type AdminRegisterRequest = {
  email: string;
  password: string;
  role: AdminRole;
};

export type AdminLanguageResponse = {
  language: string;
};

export type AdminUpdateLanguageRequest = {
  language: string;
};

export type AdminCreateAdminRequest = {
  email: string;
  password: string;
  role: AdminRole;
};

export type AdminUpdateAdminRequest = {
  status?: AdminStatus | null;
};

export type AdminCreateUserRequest = {
  email: string;
  password: string;
  language: string;
};

export type AdminUpdateUserRequest = {
  language?: string | null;
  onboardingCompleted?: boolean | null;
  status?: UserStatus | null;
};

export type AdminUpdateUserPasswordRequest = {
  newPassword: string;
};

export type AdminUserPreferencesResponse = {
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

export type AdminUpdateUserMatchmakingRequest = {
  matchmakingFilters: JsonObject;
};

export type AdminReferralCodeResponse = {
  userId: Uuid | null;
  email: string | null;
  username: string | null;
  code: string;
  usesCount: number;
  createdAt: IsoDateTime;
};

export type AdminReferralDetailResponse = {
  userId: Uuid | null;
  email: string | null;
  username: string | null;
  code: string;
  usesCount: number;
  createdAt: IsoDateTime;
  invitedCount: number;
  onboardingCompletedCount: number;
  profileCompletedCount: number;
  insightsCompletedCount: number;
  momentOrActivityCount: number;
};

export type AdminReferralUsageResponse = {
  invitedUserId: Uuid | null;
  invitedEmail: string | null;
  invitedUsername: string | null;
  createdAt: IsoDateTime;
  ip: string | null;
  userAgent: string | null;
  onboardingCompleted: boolean | null;
  profileCompleted: boolean | null;
  insightsCompletedCount: number | null;
  hasMoment: boolean | null;
  primaryActivity: string | null;
};

export type AdminCreateNotificationRequest = {
  userIds: Uuid[];
  title: string;
  body?: string | null;
  data?: Record<string, unknown> | null;
};

export type NotificationResponse = {
  id: Uuid;
  userId: Uuid;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  conversationId: Uuid | null;
  messageId: Uuid | null;
  createdByAdminId: Uuid | null;
  createdAt: IsoDateTime;
  readAt: IsoDateTime | null;
};

export type GoogleMapsSyncStatusResponse = {
  configured: boolean;
  message: string;
};

export type GoogleMapsSyncRequest = {
  latitude: number;
  longitude: number;
  radiusMeters?: number | null;
  type?: string | null;
  maxResults?: number | null;
};

export type GoogleMapsTextSearchSyncRequest = {
  query: string;
  latitude?: number | null;
  longitude?: number | null;
  radiusMeters?: number | null;
  maxResults?: number | null;
};

export type GoogleMapsSyncResponse = {
  totalFound: number;
  created: number;
  updated: number;
  errors: number;
  errorMessages: string[];
  message: string;
};

export type ViatorSyncStatusResponse = {
  configured: boolean;
  message: string;
};

export type ViatorSyncRequest = {
  count?: number | null;
  maxPages?: number | null;
  modifiedSince?: IsoDateTime | null;
  resetCursor?: boolean | null;
  language?: string | null;
};

export type ViatorSyncResponse = {
  pagesProcessed: number;
  productsSeen: number;
  created: number;
  updated: number;
  deactivated: number;
  errors: number;
  nextCursor: string | null;
  effectiveModifiedSince: IsoDateTime | null;
  errorMessages: string[];
  message: string;
};
