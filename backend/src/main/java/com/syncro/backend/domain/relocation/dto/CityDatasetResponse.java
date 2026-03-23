package com.syncro.backend.domain.relocation.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record CityDatasetResponse(
        UUID id,
        String cityName,
        String citySlug,
        String country,
        String countryCode,

        // Social integration / work
        BigDecimal expatCommunityIndex,
        BigDecimal socialIntegrationIndex,
        BigDecimal careerOpportunityIndex,
        BigDecimal remoteWorkEcosystemIndex,

        // Cost of living
        BigDecimal rentIndex,
        BigDecimal purchasingPowerIndex,
        BigDecimal groceriesIndex,
        BigDecimal restaurantIndex,
        BigDecimal costOfLivingExRentIndex,
        BigDecimal costOfLivingIncRentIndex,

        // Real estate ratios
        BigDecimal priceToIncomeRatio,
        BigDecimal priceToRentCityCenterRatio,

        // Quality of life
        BigDecimal safetyIndex,
        BigDecimal healthcareIndex,
        BigDecimal climateIndex,
        BigDecimal pollutionIndex,
        BigDecimal trafficCommuteIndex,

        // Practical economic data
        BigDecimal apartment1brCenter,
        BigDecimal apartment3brCenter,
        BigDecimal costSingleNoRent,
        BigDecimal costFamilyNoRent,

        // Extended cost data (Budget Simulator)
        BigDecimal apartment1brOutside,
        BigDecimal apartment3brOutside,
        BigDecimal utilitiesMonthly,
        BigDecimal mobilePlanMonthly,
        BigDecimal internetMonthly,
        BigDecimal mealForTwoMidrange,
        BigDecimal gasolinePerLiter,
        BigDecimal publicTransportMonthly,
        BigDecimal preschoolMonthly,
        BigDecimal internationalSchoolAnnual,

        // Calculated macroaree
        BigDecimal macroCostoVita,
        BigDecimal macroMercatoImmobiliare,
        BigDecimal macroPotereEconomico,
        BigDecimal macroQualitaVita,
        BigDecimal macroOpportunitaLavorative,
        BigDecimal macroIntegrazioneSociale,

        // Districts, image and metadata
        List<Map<String, String>> districts,
        String imageUrl,
        Boolean active,
        Instant createdAt,
        Instant updatedAt
) {}
