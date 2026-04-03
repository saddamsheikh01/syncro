/** Admin Expats API types (mirror backend relocation DTOs). */

export type AdminCityDistrict = { name: string; description?: string };

export interface AdminCityDatasetResponse {
  id: string;
  cityName: string;
  citySlug: string;
  country: string;
  countryCode: string;
  expatCommunityIndex: number;
  socialIntegrationIndex: number;
  careerOpportunityIndex: number;
  remoteWorkEcosystemIndex: number;
  rentIndex: number;
  purchasingPowerIndex: number;
  groceriesIndex: number;
  restaurantIndex: number;
  costOfLivingExRentIndex: number;
  costOfLivingIncRentIndex: number;
  priceToIncomeRatio: number;
  priceToRentCityCenterRatio: number;
  safetyIndex: number;
  healthcareIndex: number;
  climateIndex: number;
  pollutionIndex: number;
  trafficCommuteIndex: number;
  apartment1brCenter: number;
  apartment3brCenter: number;
  costSingleNoRent: number;
  costFamilyNoRent: number;
  macroCostoVita: number;
  macroMercatoImmobiliare: number;
  macroPotereEconomico: number;
  macroQualitaVita: number;
  macroOpportunitaLavorative: number;
  macroIntegrazioneSociale: number;
  districts: AdminCityDistrict[] | null;
  imageUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AdminCreateCityPayload = {
  cityName: string;
  citySlug: string;
  country: string;
  countryCode: string;
  expatCommunityIndex: number;
  socialIntegrationIndex: number;
  careerOpportunityIndex: number;
  remoteWorkEcosystemIndex: number;
  rentIndex: number;
  purchasingPowerIndex: number;
  groceriesIndex: number;
  restaurantIndex: number;
  costOfLivingExRentIndex: number;
  costOfLivingIncRentIndex: number;
  priceToIncomeRatio: number;
  priceToRentCityCenterRatio: number;
  safetyIndex: number;
  healthcareIndex: number;
  climateIndex: number;
  pollutionIndex: number;
  trafficCommuteIndex: number;
  apartment1brCenter: number;
  apartment3brCenter: number;
  costSingleNoRent: number;
  costFamilyNoRent: number;
  districts: AdminCityDistrict[];
  imageUrl?: string;
};

export type AdminUpdateCityPayload = Partial<
  Omit<AdminCreateCityPayload, "citySlug" | "cityName">
> & {
  cityName?: string;
  country?: string;
  countryCode?: string;
  active?: boolean;
  districts?: AdminCityDistrict[];
  imageUrl?: string;
};

export interface AdminWeightRuleResponse {
  id: string;
  questionKey: string;
  answerValue: string;
  weightAdjustments: Record<string, number>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCreateWeightRulePayload {
  questionKey: string;
  answerValue: string;
  weightAdjustments: Record<string, number>;
}

export interface AdminUpdateWeightRulePayload {
  weightAdjustments?: Record<string, number>;
  active?: boolean;
}

export interface AdminScoringConfigResponse {
  id: string;
  configKey: string;
  thresholds: Record<string, unknown>;
  budgetMarginThresholds: Record<string, unknown>;
  budgetPenaltyThresholds: Record<string, unknown>;
  lifestyleMultipliers: Record<string, unknown>;
  priorityThresholds: Record<string, unknown>;
  cityPerformanceThresholds: Record<string, unknown>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUpdateScoringConfigPayload {
  thresholds?: Record<string, unknown>;
  budgetMarginThresholds?: Record<string, unknown>;
  budgetPenaltyThresholds?: Record<string, unknown>;
  lifestyleMultipliers?: Record<string, unknown>;
  priorityThresholds?: Record<string, unknown>;
  cityPerformanceThresholds?: Record<string, unknown>;
}

export interface AdminWaitingListEntry {
  id: string;
  email: string;
  cityName: string;
  notified: boolean;
  createdAt: string;
}

// ─── Admin Sessions (funnel tracking) ───────────────────────────────────────

export interface AdminSessionAnswerSummary {
  questionKey: string;
  questionGroup: string;
  stepNumber: number;
  answerValue: unknown;
  version: number;
  answeredAt: string;
}

export interface AdminSessionResponse {
  id: string;
  status: string;
  userType: string | null;
  currentStep: number;
  totalSteps: number;
  targetCityName: string | null;
  currentCityName: string | null;
  converted: boolean;
  convertedUserId: string | null;
  convertedUserEmail: string | null;
  convertedAt: string | null;
  metadata: Record<string, unknown> | null;
  answers: AdminSessionAnswerSummary[];
  createdAt: string;
  updatedAt: string;
}

// ─── Admin Funnel Analytics ─────────────────────────────────────────────────

export interface FunnelStepDropOff {
  step: number;
  sessionsReached: number;
  sessionsDropped: number;
  dropOffRate: number;
}

export interface FunnelCityCount {
  cityName: string;
  count: number;
}

export interface FunnelAnswerDistribution {
  questionKey: string;
  valueCounts: Record<string, number>;
}

export interface FunnelAnalyticsResponse {
  totalSessions: number;
  completedSessions: number;
  convertedSessions: number;
  expiredSessions: number;
  inProgressSessions: number;
  completionRate: number;
  conversionRate: number;
  stepDropOff: FunnelStepDropOff[];
  topTargetCities: FunnelCityCount[];
  topCurrentCities: FunnelCityCount[];
  answerDistributions: FunnelAnswerDistribution[];
  waitingListTop: FunnelCityCount[];
}

// ─── Admin Budget Simulations ───────────────────────────────────────────────

export interface AdminBudgetSimulation {
  id: string;
  source: "anonymous" | "registered";
  userId: string | null;
  userEmail: string | null;
  sessionId: string | null;
  cityId: string | null;
  cityName: string | null;
  planCode: string;
  estimatedMonthlyCost: number | null;
  monthlyBalance: number | null;
  balanceStatus: string | null;
  inputPayload: Record<string, unknown>;
  outputPayload: Record<string, unknown>;
  algorithmVersion: string;
  createdAt: string;
}

export interface AdminBudgetStats {
  total: number;
  anonymous: number;
  registered: number;
  last24h: number;
  topCity: string | null;
  byPlan: Record<string, number>;
}
