package com.syncro.backend.domain.relocation.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record CreateCityDatasetRequest(
        @NotBlank @Size(max = 255)
        String cityName,

        @NotBlank @Size(max = 255)
        String citySlug,

        @NotBlank @Size(max = 100)
        String country,

        @NotBlank @Size(max = 5)
        String countryCode,

        // Social integration / work
        @NotNull @DecimalMin("0.00") BigDecimal expatCommunityIndex,
        @NotNull @DecimalMin("0.00") BigDecimal socialIntegrationIndex,
        @NotNull @DecimalMin("0.00") BigDecimal careerOpportunityIndex,
        @NotNull @DecimalMin("0.00") BigDecimal remoteWorkEcosystemIndex,

        // Cost of living
        @NotNull @DecimalMin("0.00") BigDecimal rentIndex,
        @NotNull @DecimalMin("0.00") BigDecimal purchasingPowerIndex,
        @NotNull @DecimalMin("0.00") BigDecimal groceriesIndex,
        @NotNull @DecimalMin("0.00") BigDecimal restaurantIndex,
        @NotNull @DecimalMin("0.00") BigDecimal costOfLivingExRentIndex,
        @NotNull @DecimalMin("0.00") BigDecimal costOfLivingIncRentIndex,

        // Real estate ratios
        @NotNull @DecimalMin("0.00") BigDecimal priceToIncomeRatio,
        @NotNull @DecimalMin("0.00") BigDecimal priceToRentCityCenterRatio,

        // Quality of life
        @NotNull @DecimalMin("0.00") BigDecimal safetyIndex,
        @NotNull @DecimalMin("0.00") BigDecimal healthcareIndex,
        @NotNull @DecimalMin("0.00") BigDecimal climateIndex,
        @NotNull @DecimalMin("0.00") BigDecimal pollutionIndex,
        @NotNull @DecimalMin("0.00") BigDecimal trafficCommuteIndex,

        // Practical economic data (EUR)
        @NotNull @DecimalMin("0.00") BigDecimal apartment1brCenter,
        @NotNull @DecimalMin("0.00") BigDecimal apartment3brCenter,
        @NotNull @DecimalMin("0.00") BigDecimal costSingleNoRent,
        @NotNull @DecimalMin("0.00") BigDecimal costFamilyNoRent,

        // Districts
        List<Map<String, String>> districts
) {}
