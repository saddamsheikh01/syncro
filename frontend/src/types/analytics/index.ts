import type { IsoDate, IsoDateTime, JsonObject, Uuid } from "../shared";

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

export type AnalyticsKpiResponse = {
  registrationsDaily: KpiPoint[];
  registrationsWeekly: KpiPoint[];
  onboardingCompletedDaily: KpiPoint[];
  onboardingCompletedWeekly: KpiPoint[];
  activeUsersDaily: KpiPoint[];
  activeUsersWeekly: KpiPoint[];
  returningUsers: number;
  matchSectionOpenedDaily: KpiPoint[];
  profileViewedDaily: KpiPoint[];
  mapOpenedDaily: KpiPoint[];
  averageSessionDurationSeconds: number;
};

export type AnalyticsKpiParams = {
  from?: IsoDate;
  to?: IsoDate;
};
