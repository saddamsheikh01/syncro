package com.syncro.backend.integration;

import com.syncro.backend.domain.relocation.entity.RelocationCityDataset;
import com.syncro.backend.domain.relocation.entity.RelocationScoringConfig;
import com.syncro.backend.domain.relocation.entity.RelocationWeightRule;
import com.syncro.backend.domain.relocation.repository.RelocationCityDatasetRepository;
import com.syncro.backend.domain.relocation.repository.RelocationScoringConfigRepository;
import com.syncro.backend.domain.relocation.repository.RelocationWeightRuleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.math.BigDecimal;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for the City Comparison feature (POST /api/v1/relocation/city-scoring/compare).
 * Uses Testcontainers PostgreSQL with real Flyway migrations.
 */
class CityComparisonIntegrationTest extends Sprint1IntegrationBaseTest {

    @Autowired private RelocationCityDatasetRepository cityRepository;
    @Autowired private RelocationScoringConfigRepository configRepository;
    @Autowired private RelocationWeightRuleRepository weightRuleRepository;

    private RelocationCityDataset milanoCity;
    private RelocationCityDataset valenciaCity;

    @BeforeEach
    void setUpCities() {
        // Ensure scoring config exists
        if (configRepository.findByConfigKeyAndActiveTrue("scoring_v1").isEmpty()) {
            RelocationScoringConfig config = new RelocationScoringConfig();
            config.setConfigKey("scoring_v1");
            config.setActive(true);
            config.setThresholds(Map.of(
                    "very_strong_fit", 80, "good_fit", 70, "moderate_fit", 60, "weak_fit", 50, "low_fit", 0));
            config.setBudgetMarginThresholds(Map.of(
                    "sustainable", 400, "tight", 100, "very_tight", 0, "unsustainable", -1));
            config.setBudgetPenaltyThresholds(Map.of(
                    "light", -5, "medium", -10, "heavy", -20));
            config.setLifestyleMultipliers(Map.of(
                    "essential", 0.9, "balanced", 1.0, "premium", 1.2, "luxury", 1.5));
            config.setPriorityThresholds(Map.of(
                    "very_high", 0.25, "high", 0.18, "medium", 0.10, "low", 0.05, "very_low", 0));
            config.setCityPerformanceThresholds(Map.of(
                    "strong", 75, "good", 60, "medium", 45));
            configRepository.save(config);
        }

        // Ensure weight rules exist
        if (weightRuleRepository.findByActiveTrue().isEmpty()) {
            RelocationWeightRule r1 = new RelocationWeightRule();
            r1.setQuestionKey("life_state");
            r1.setAnswerValue("planning_move");
            r1.setWeightAdjustments(Map.of("costo_vita", 5, "mercato_immobiliare", 10));
            r1.setActive(true);
            weightRuleRepository.save(r1);

            RelocationWeightRule r2 = new RelocationWeightRule();
            r2.setQuestionKey("motivation");
            r2.setAnswerValue("career");
            r2.setWeightAdjustments(Map.of("opportunita_lavorative", 15, "potere_economico", 10));
            r2.setActive(true);
            weightRuleRepository.save(r2);
        }

        // Create two test cities (find or create to avoid duplicate slug constraint violations)
        milanoCity = findOrCreateCity("Milano-Test", "milano-test", "Italy", "IT",
                new BigDecimal("25.00"), new BigDecimal("30.00"), new BigDecimal("70.00"),
                new BigDecimal("75.00"), new BigDecimal("65.00"), new BigDecimal("50.00"),
                new BigDecimal("1200.00"), new BigDecimal("2400.00"),
                new BigDecimal("800.00"), new BigDecimal("1600.00"));

        valenciaCity = findOrCreateCity("Valencia-Test", "valencia-test", "Spain", "ES",
                new BigDecimal("60.00"), new BigDecimal("55.00"), new BigDecimal("45.00"),
                new BigDecimal("80.00"), new BigDecimal("50.00"), new BigDecimal("70.00"),
                new BigDecimal("700.00"), new BigDecimal("1400.00"),
                new BigDecimal("500.00"), new BigDecimal("1000.00"));
    }

    @Test
    @DisplayName("POST compare with two valid cities returns 200 with full comparison response")
    void compareCities_twoValidCities_returns200() throws Exception {
        String jwtToken = completeOnboardingAndCreateSnapshot();

        String body = """
                {
                    "currentCityId": "%s",
                    "targetCityId": "%s"
                }
                """.formatted(milanoCity.getId(), valenciaCity.getId());

        mockMvc.perform(post("/api/v1/relocation/city-scoring/compare")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentCity.name").value("Milano-Test"))
                .andExpect(jsonPath("$.targetCity.name").value("Valencia-Test"))
                .andExpect(jsonPath("$.macroareeComparison").isArray())
                .andExpect(jsonPath("$.macroareeComparison.length()").value(6))
                .andExpect(jsonPath("$.economicImpact").exists())
                .andExpect(jsonPath("$.economicImpact.monthlySaving").exists())
                .andExpect(jsonPath("$.priorityAlignment").exists())
                .andExpect(jsonPath("$.tradeOffs").isArray())
                .andExpect(jsonPath("$.overallImpact").exists())
                .andExpect(jsonPath("$.overallImpact.scoreCurrentCity").isNumber())
                .andExpect(jsonPath("$.overallImpact.scoreTargetCity").isNumber())
                .andExpect(jsonPath("$.userWeights").isMap())
                .andExpect(jsonPath("$.algorithmVersion").value("1.0"));
    }

    @Test
    @DisplayName("POST compare without auth returns 401")
    void compareCities_noAuth_returns401() throws Exception {
        String body = """
                {
                    "currentCityId": "%s",
                    "targetCityId": "%s"
                }
                """.formatted(milanoCity.getId(), valenciaCity.getId());

        mockMvc.perform(post("/api/v1/relocation/city-scoring/compare")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST compare with non-existent city returns 404")
    void compareCities_cityNotFound_returns404() throws Exception {
        String jwtToken = completeOnboardingAndCreateSnapshot();

        String body = """
                {
                    "currentCityId": "00000000-0000-0000-0000-000000000001",
                    "targetCityId": "%s"
                }
                """.formatted(valenciaCity.getId());

        mockMvc.perform(post("/api/v1/relocation/city-scoring/compare")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST compare without active snapshot returns 409 CONFLICT")
    void compareCities_noSnapshot_returns409() throws Exception {
        Object[] userAndToken = createUserAndGetToken();
        String jwtToken = (String) userAndToken[1];

        // Create profile but do NOT create snapshot
        String profileBody = """
                {
                    "userType": "planning_move",
                    "completedSteps": 5
                }
                """;

        mockMvc.perform(patch("/api/v1/relocation/onboarding")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(profileBody))
                .andExpect(status().isOk());

        String body = """
                {
                    "currentCityId": "%s",
                    "targetCityId": "%s"
                }
                """.formatted(milanoCity.getId(), valenciaCity.getId());

        mockMvc.perform(post("/api/v1/relocation/city-scoring/compare")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict());
    }

    // ========== HELPERS ==========

    /**
     * Creates user, completes onboarding to 10 steps, creates snapshot, returns JWT token.
     */
    private String completeOnboardingAndCreateSnapshot() throws Exception {
        Object[] userAndToken = createUserAndGetToken();
        String jwtToken = (String) userAndToken[1];

        // Complete profile
        String profileBody = """
                {
                    "userType": "planning_move",
                    "household": "single",
                    "monthlyBudget": 2500,
                    "primaryGoal": "career",
                    "socialPriority": "medium",
                    "desiredLifestyle": "balanced",
                    "workStatus": "employed",
                    "priorityProblem": "monthly_costs",
                    "freeNotes": "Test notes for comparison",
                    "completedSteps": 10
                }
                """;

        mockMvc.perform(patch("/api/v1/relocation/onboarding")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(profileBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        // Create snapshot
        mockMvc.perform(post("/api/v1/relocation/onboarding/snapshots")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(1))
                .andExpect(jsonPath("$.isActive").value(true));

        return jwtToken;
    }

    private RelocationCityDataset findOrCreateCity(String name, String slug, String country, String countryCode,
                                                    BigDecimal costoVita, BigDecimal mercatoImm, BigDecimal potereEco,
                                                    BigDecimal qualitaVita, BigDecimal oppLav, BigDecimal intSoc,
                                                    BigDecimal apt1br, BigDecimal apt3br,
                                                    BigDecimal costSingle, BigDecimal costFamily) {
        return cityRepository.findByCitySlugAndActiveTrue(slug)
                .orElseGet(() -> buildAndSaveCity(name, slug, country, countryCode,
                        costoVita, mercatoImm, potereEco, qualitaVita, oppLav, intSoc,
                        apt1br, apt3br, costSingle, costFamily));
    }

    private RelocationCityDataset buildAndSaveCity(String name, String slug, String country, String countryCode,
                                                    BigDecimal costoVita, BigDecimal mercatoImm, BigDecimal potereEco,
                                                    BigDecimal qualitaVita, BigDecimal oppLav, BigDecimal intSoc,
                                                    BigDecimal apt1br, BigDecimal apt3br,
                                                    BigDecimal costSingle, BigDecimal costFamily) {
        RelocationCityDataset city = new RelocationCityDataset();
        city.setCityName(name);
        city.setCitySlug(slug);
        city.setCountry(country);
        city.setCountryCode(countryCode);
        city.setActive(true);

        // Raw indices (required non-null by entity constraints)
        city.setExpatCommunityIndex(new BigDecimal("70.00"));
        city.setSocialIntegrationIndex(new BigDecimal("65.00"));
        city.setCareerOpportunityIndex(new BigDecimal("60.00"));
        city.setRemoteWorkEcosystemIndex(new BigDecimal("55.00"));
        city.setRentIndex(new BigDecimal("40.00"));
        city.setPurchasingPowerIndex(new BigDecimal("60.00"));
        city.setGroceriesIndex(new BigDecimal("45.00"));
        city.setRestaurantIndex(new BigDecimal("50.00"));
        city.setCostOfLivingExRentIndex(new BigDecimal("42.00"));
        city.setCostOfLivingIncRentIndex(new BigDecimal("40.00"));
        city.setPriceToIncomeRatio(new BigDecimal("12.00"));
        city.setPriceToRentCityCenterRatio(new BigDecimal("22.00"));
        city.setSafetyIndex(new BigDecimal("68.00"));
        city.setHealthcareIndex(new BigDecimal("72.00"));
        city.setClimateIndex(new BigDecimal("75.00"));
        city.setPollutionIndex(new BigDecimal("30.00"));
        city.setTrafficCommuteIndex(new BigDecimal("35.00"));

        city.setApartment1brCenter(apt1br);
        city.setApartment3brCenter(apt3br);
        city.setCostSingleNoRent(costSingle);
        city.setCostFamilyNoRent(costFamily);

        // Pre-computed macroaree
        city.setMacroCostoVita(costoVita);
        city.setMacroMercatoImmobiliare(mercatoImm);
        city.setMacroPotereEconomico(potereEco);
        city.setMacroQualitaVita(qualitaVita);
        city.setMacroOpportunitaLavorative(oppLav);
        city.setMacroIntegrazioneSociale(intSoc);

        return cityRepository.save(city);
    }
}
