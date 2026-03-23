package com.syncro.backend.domain.relocation.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record UpdateCityDatasetRequest(
        @Size(max = 255)
        String cityName,

        @Size(max = 100)
        String country,

        @Size(max = 5)
        String countryCode,

        // Social integration / work
        @DecimalMin("0.00") BigDecimal expatCommunityIndex,
        @DecimalMin("0.00") BigDecimal socialIntegrationIndex,
        @DecimalMin("0.00") BigDecimal careerOpportunityIndex,
        @DecimalMin("0.00") BigDecimal remoteWorkEcosystemIndex,

        // Cost of living
        @DecimalMin("0.00") BigDecimal rentIndex,
        @DecimalMin("0.00") BigDecimal purchasingPowerIndex,
        @DecimalMin("0.00") BigDecimal groceriesIndex,
        @DecimalMin("0.00") BigDecimal restaurantIndex,
        @DecimalMin("0.00") BigDecimal costOfLivingExRentIndex,
        @DecimalMin("0.00") BigDecimal costOfLivingIncRentIndex,

        // Real estate ratios
        @DecimalMin("0.00") BigDecimal priceToIncomeRatio,
        @DecimalMin("0.00") BigDecimal priceToRentCityCenterRatio,

        // Quality of life
        @DecimalMin("0.00") BigDecimal safetyIndex,
        @DecimalMin("0.00") BigDecimal healthcareIndex,
        @DecimalMin("0.00") BigDecimal climateIndex,
        @DecimalMin("0.00") BigDecimal pollutionIndex,
        @DecimalMin("0.00") BigDecimal trafficCommuteIndex,

        // Practical economic data (EUR)
        @DecimalMin("0.00") BigDecimal apartment1brCenter,
        @DecimalMin("0.00") BigDecimal apartment3brCenter,
        @DecimalMin("0.00") BigDecimal costSingleNoRent,
        @DecimalMin("0.00") BigDecimal costFamilyNoRent,

        // Districts and image
        List<Map<String, String>> districts,

        @Size(max = 500)
        String imageUrl,

        Boolean active
) {}
