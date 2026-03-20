import type { AdminCreateCityPayload } from "@/types/adminExpats";

/** Sensible defaults for a new city row (admin can adjust before save). */
export const defaultCreateCityPayload = (): AdminCreateCityPayload => ({
  cityName: "",
  citySlug: "",
  country: "",
  countryCode: "",
  expatCommunityIndex: 55,
  socialIntegrationIndex: 55,
  careerOpportunityIndex: 55,
  remoteWorkEcosystemIndex: 55,
  rentIndex: 55,
  purchasingPowerIndex: 55,
  groceriesIndex: 55,
  restaurantIndex: 55,
  costOfLivingExRentIndex: 55,
  costOfLivingIncRentIndex: 55,
  priceToIncomeRatio: 12,
  priceToRentCityCenterRatio: 18,
  safetyIndex: 65,
  healthcareIndex: 60,
  climateIndex: 70,
  pollutionIndex: 40,
  trafficCommuteIndex: 45,
  apartment1brCenter: 1200,
  apartment3brCenter: 2200,
  costSingleNoRent: 900,
  costFamilyNoRent: 2800,
  districts: [],
});

export const slugify = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
