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
};

export type AdminUpdateCityPayload = Partial<
  Omit<AdminCreateCityPayload, "citySlug" | "cityName">
> & {
  cityName?: string;
  country?: string;
  countryCode?: string;
  active?: boolean;
  districts?: AdminCityDistrict[];
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
