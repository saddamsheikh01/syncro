import type { IsoDate, IsoDateTime, JsonObject } from "../shared";

export type AnalyticsEventType =
  | "USER_REGISTERED"
  | "ONBOARDING_COMPLETED"
  | "APP_OPEN"
  | "MATCH_SECTION_OPENED"
  | "MAP_OPENED"
  | "PROFILE_VIEWED"
  | "SESSION_DURATION"
  | "FEEDBACK_SUBMITTED";

export type AnalyticsEventRequest = {
  eventType: AnalyticsEventType;
  payload?: JsonObject | null;
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
