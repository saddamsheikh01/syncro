import type { IsoDate, IsoDateTime, JsonObject, PageResponse, Uuid } from "../shared";

export type AnalyticsLegacyEventType =
  | "APP_OPEN"
  | "MATCH_SECTION_OPENED"
  | "MAP_OPENED"
  | "PROFILE_VIEWED"
  | "SESSION_DURATION"
  | "FEEDBACK_SUBMITTED";

export type AnalyticsTrackInput = {
  eventName?: string;
  // Compatibilità con i punti legacy già presenti nell'app.
  eventType?: AnalyticsLegacyEventType;
  payload?: JsonObject | null;
  route?: string | null;
  occurredAt?: IsoDateTime;
};

export type AnalyticsBatchEventRequest = {
  eventId: Uuid;
  eventName: string;
  eventVersion: number;
  idempotencyKey: string;
  sessionId: Uuid;
  occurredAt: IsoDateTime;
  route?: string | null;
  platform?: string | null;
  appVersion?: string | null;
  eventSource?: string | null;
  consentAnalytics?: boolean | null;
  userAgent?: string | null;
  payload?: JsonObject | null;
};

export type AnalyticsBatchRequest = {
  events: AnalyticsBatchEventRequest[];
};

export type AnalyticsBatchResponse = {
  accepted: number;
  duplicates: number;
  rejected: number;
};

export type KpiPoint = {
  bucket: IsoDateTime;
  value: number;
};

export type AnalyticsSegmentCountResponse = {
  label: string;
  count: number;
};

export type AnalyticsKpiResponse = {
  registrationsDaily: KpiPoint[];
  registrationsWeekly: KpiPoint[];
  onboardingCompletedDaily: KpiPoint[];
  onboardingCompletedWeekly: KpiPoint[];
  onboardingCompletedUsersTotal: number;
  activeUsersDaily: KpiPoint[];
  activeUsersWeekly: KpiPoint[];
  returningUsers: number;
  matchSectionOpenedDaily: KpiPoint[];
  profileViewedDaily: KpiPoint[];
  mapOpenedDaily: KpiPoint[];
  averageSessionDurationSeconds: number;
  countryDistribution: AnalyticsSegmentCountResponse[];
  cityDistribution: AnalyticsSegmentCountResponse[];
  genderDistribution: AnalyticsSegmentCountResponse[];
  ageDistribution: AnalyticsSegmentCountResponse[];
};

export type AnalyticsKpiParams = {
  from?: IsoDate;
  to?: IsoDate;
};

export type AdminUserFeatureUsageResponse = {
  userId: Uuid;
  email: string | null;
  username: string | null;
  fullName: string | null;
  country: string | null;
  city: string | null;
  gender: string | null;
  age: number | null;
  onboardingCompleted: boolean;
  chatUses: number;
  mapUses: number;
  matchUses: number;
  momentsUses: number;
  interestsCount: number;
  testsCompleted: number;
  testsRequired: number;
  profileCompleted: boolean;
  profileCompletionPercent: number;
  missingSections: string[];
};

export type AdminUsersFeatureUsageParams = AnalyticsKpiParams & {
  q?: string;
  page?: number;
  size?: number;
};

export type AdminUsersFeatureUsagePageResponse =
  PageResponse<AdminUserFeatureUsageResponse>;

export type AdminUserAnalyticsResponse = {
  userId: Uuid;
  email: string | null;
  username: string | null;
  fullName: string | null;
  onboardingCompleted: boolean;
  country: string | null;
  city: string | null;
  gender: string | null;
  age: number | null;
  chatUses: number;
  mapUses: number;
  matchUses: number;
  momentsUses: number;
  interestsCount: number;
  testsCompleted: number;
  testsRequired: number;
  profileCompleted: boolean;
  profileCompletionPercent: number;
  missingSections: string[];
  chatDaily: KpiPoint[];
  mapDaily: KpiPoint[];
  matchDaily: KpiPoint[];
  momentsDaily: KpiPoint[];
};
