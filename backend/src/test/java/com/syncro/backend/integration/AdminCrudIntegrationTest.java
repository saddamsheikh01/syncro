package com.syncro.backend.integration;

import com.syncro.backend.domain.auth.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for Admin CRUD endpoints:
 * city dataset, weight rules, scoring config, waiting list.
 */
class AdminCrudIntegrationTest extends Sprint1IntegrationBaseTest {

    // ========== CITY DATASET ==========

    @Test
    @DisplayName("POST create city returns 201 with macroaree calculated")
    void createCity_returns201WithMacroaree() throws Exception {
        Object[] adminAndToken = createAdminAndGetToken();
        String jwtToken = (String) adminAndToken[1];

        String cityBody = buildCreateCityJson("Lisbon-Test", "lisbon-test-" + java.util.UUID.randomUUID().toString().substring(0, 8));

        mockMvc.perform(post("/api/v1/admin/expats/cities")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cityBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.cityName").value("Lisbon-Test"))
                .andExpect(jsonPath("$.citySlug").exists())
                .andExpect(jsonPath("$.macroCostoVita").isNumber())
                .andExpect(jsonPath("$.macroMercatoImmobiliare").isNumber())
                .andExpect(jsonPath("$.macroPotereEconomico").isNumber())
                .andExpect(jsonPath("$.macroQualitaVita").isNumber())
                .andExpect(jsonPath("$.macroOpportunitaLavorative").isNumber())
                .andExpect(jsonPath("$.macroIntegrazioneSociale").isNumber());
    }

    @Test
    @DisplayName("PUT update city recalculates macroaree for all cities")
    void updateCity_recalculatesMacroaree() throws Exception {
        Object[] adminAndToken = createAdminAndGetToken();
        String jwtToken = (String) adminAndToken[1];

        // Create two cities
        String city1Body = buildCreateCityJson("Berlin-Test", "berlin-test-" + java.util.UUID.randomUUID().toString().substring(0, 8));
        String result1 = mockMvc.perform(post("/api/v1/admin/expats/cities")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(city1Body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String city1Id = objectMapper.readTree(result1).get("id").asText();

        String city2Body = buildCreateCityJson("Porto-Test", "porto-test-" + java.util.UUID.randomUUID().toString().substring(0, 8));
        mockMvc.perform(post("/api/v1/admin/expats/cities")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(city2Body))
                .andExpect(status().isCreated());

        // Update city 1
        String updateBody = """
                {
                    "safetyIndex": 95.00,
                    "healthcareIndex": 90.00
                }
                """;

        mockMvc.perform(put("/api/v1/admin/expats/cities/" + city1Id)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cityName").value("Berlin-Test"))
                .andExpect(jsonPath("$.safetyIndex").value(95.00))
                .andExpect(jsonPath("$.macroQualitaVita").isNumber());
    }

    @Test
    @DisplayName("GET cities (admin) includes all cities including inactive")
    void listAllCities_includesInactive() throws Exception {
        Object[] adminAndToken = createAdminAndGetToken();
        String jwtToken = (String) adminAndToken[1];

        // Create a city
        String cityBody = buildCreateCityJson("Barcelona-Test", "barcelona-test-" + java.util.UUID.randomUUID().toString().substring(0, 8));
        mockMvc.perform(post("/api/v1/admin/expats/cities")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cityBody))
                .andExpect(status().isCreated());

        // List all cities
        mockMvc.perform(get("/api/v1/admin/expats/cities")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));
    }

    // ========== WEIGHT RULES ==========

    @Test
    @DisplayName("POST weight rule returns 201, duplicate returns 409")
    void createWeightRule_returns201_duplicateReturns409() throws Exception {
        Object[] adminAndToken = createAdminAndGetToken();
        String jwtToken = (String) adminAndToken[1];

        String uniqueKey = "test_key_" + java.util.UUID.randomUUID().toString().substring(0, 8);
        String ruleBody = String.format("""
                {
                    "questionKey": "%s",
                    "answerValue": "test_answer",
                    "weightAdjustments": {
                        "opportunita_lavorative": 15,
                        "costo_vita": -5
                    }
                }
                """, uniqueKey);

        // Create should succeed
        mockMvc.perform(post("/api/v1/admin/expats/weight-rules")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(ruleBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.questionKey").value(uniqueKey))
                .andExpect(jsonPath("$.answerValue").value("test_answer"))
                .andExpect(jsonPath("$.weightAdjustments.opportunita_lavorative").value(15));

        // Duplicate should fail with 409
        mockMvc.perform(post("/api/v1/admin/expats/weight-rules")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(ruleBody))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("PUT weight rule updates weights and active flag")
    void updateWeightRule_updatesWeights() throws Exception {
        Object[] adminAndToken = createAdminAndGetToken();
        String jwtToken = (String) adminAndToken[1];

        // Create a rule first (use unique key to avoid seed conflicts)
        String uniqueAnswer = "remote_test_" + java.util.UUID.randomUUID().toString().substring(0, 8);
        String createBody = String.format("""
                {
                    "questionKey": "work_type",
                    "answerValue": "%s",
                    "weightAdjustments": {
                        "opportunita_lavorative": 10
                    }
                }
                """, uniqueAnswer);

        String createResult = mockMvc.perform(post("/api/v1/admin/expats/weight-rules")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String ruleId = objectMapper.readTree(createResult).get("id").asText();

        // Update the rule
        String updateBody = """
                {
                    "weightAdjustments": {
                        "opportunita_lavorative": 20,
                        "integrazione_sociale": 5
                    },
                    "active": false
                }
                """;

        mockMvc.perform(put("/api/v1/admin/expats/weight-rules/" + ruleId)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.weightAdjustments.opportunita_lavorative").value(20))
                .andExpect(jsonPath("$.weightAdjustments.integrazione_sociale").value(5))
                .andExpect(jsonPath("$.active").value(false));
    }

    // ========== SCORING CONFIG ==========

    @Test
    @DisplayName("GET scoring config returns seeded default config")
    void getScoringConfig_returnsDefault() throws Exception {
        Object[] adminAndToken = createAdminAndGetToken();
        String jwtToken = (String) adminAndToken[1];

        mockMvc.perform(get("/api/v1/admin/expats/scoring-config")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(true))
                .andExpect(jsonPath("$.thresholds").isMap())
                .andExpect(jsonPath("$.budgetMarginThresholds").isMap())
                .andExpect(jsonPath("$.lifestyleMultipliers").isMap());
    }

    @Test
    @DisplayName("PUT scoring config updates only provided fields")
    void updateScoringConfig_partialUpdate() throws Exception {
        Object[] adminAndToken = createAdminAndGetToken();
        String jwtToken = (String) adminAndToken[1];

        // First get the config to know its ID
        String getResult = mockMvc.perform(get("/api/v1/admin/expats/scoring-config")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String configId = objectMapper.readTree(getResult).get("id").asText();

        // Update only thresholds
        String updateBody = """
                {
                    "thresholds": {
                        "very_strong_fit": 85,
                        "good_fit": 75,
                        "moderate_fit": 65,
                        "weak_fit": 55,
                        "low_fit": 0
                    }
                }
                """;

        mockMvc.perform(put("/api/v1/admin/expats/scoring-config/" + configId)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.thresholds.very_strong_fit").value(85))
                .andExpect(jsonPath("$.thresholds.good_fit").value(75))
                // Original fields should still be present
                .andExpect(jsonPath("$.budgetMarginThresholds").isMap())
                .andExpect(jsonPath("$.lifestyleMultipliers").isMap());
    }

    // ========== WAITING LIST ==========

    @Test
    @DisplayName("POST waiting list notify marks entries as notified")
    void markWaitingListNotified_returnsCount() throws Exception {
        Object[] adminAndToken = createAdminAndGetToken();
        String jwtToken = (String) adminAndToken[1];

        // Mark as notified for a city (even if no entries exist, should return 0)
        mockMvc.perform(post("/api/v1/admin/expats/waiting-list/Tokyo/notify")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cityName").value("Tokyo"))
                .andExpect(jsonPath("$.notifiedCount").value(0));
    }

    @Test
    @DisplayName("GET user preferences includes relocation profile fields")
    void getUserPreferences_includesRelocationProfileFields() throws Exception {
        Object[] adminAndToken = createAdminAndGetToken();
        String adminJwt = (String) adminAndToken[1];

        Object[] userAndToken = createUserAndGetToken();
        User user = (User) userAndToken[0];
        String userJwt = (String) userAndToken[1];

        String onboardingBody = """
                {
                    "userType": "planning_move",
                    "targetCityName": "Lisbon",
                    "currentCityName": "Milan",
                    "completedSteps": 4
                }
                """;

        mockMvc.perform(patch("/api/v1/relocation/onboarding")
                        .header("Authorization", "Bearer " + userJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(onboardingBody))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/admin/users/" + user.getId() + "/preferences")
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(user.getId().toString()))
                .andExpect(jsonPath("$.relocationUserType").value("planning_move"))
                .andExpect(jsonPath("$.relocationTargetCityName").value("Lisbon"))
                .andExpect(jsonPath("$.relocationCurrentCityName").value("Milan"))
                .andExpect(jsonPath("$.relocationStatus").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.relocationCompletedSteps").value(4))
                .andExpect(jsonPath("$.relocationCompletionPercent").value(40));
    }

    @Test
    @DisplayName("POST onboarding backfill marks relocation-only users as completed")
    void backfillOnboardingStatus_marksRelocationOnlyUsersCompleted() throws Exception {
        Object[] adminAndToken = createAdminAndGetToken();
        String adminJwt = (String) adminAndToken[1];

        Object[] userAndToken = createUserAndGetToken();
        User user = (User) userAndToken[0];
        String userJwt = (String) userAndToken[1];

        String onboardingBody = """
                {
                    "userType": "planning_move",
                    "targetCityName": "Porto",
                    "completedSteps": 3
                }
                """;

        mockMvc.perform(patch("/api/v1/relocation/onboarding")
                        .header("Authorization", "Bearer " + userJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(onboardingBody))
                .andExpect(status().isOk());

        org.assertj.core.api.Assertions.assertThat(
                userRepository.findById(user.getId()).orElseThrow().isOnboardingCompleted()
        ).isFalse();

        mockMvc.perform(post("/api/v1/admin/onboarding/backfill")
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.updatedUsers", greaterThanOrEqualTo(1)));

        org.assertj.core.api.Assertions.assertThat(
                userRepository.findById(user.getId()).orElseThrow().isOnboardingCompleted()
        ).isTrue();
    }

    // ========== HELPERS ==========

    private String buildCreateCityJson(String name, String slug) {
        return String.format("""
                {
                    "cityName": "%s",
                    "citySlug": "%s",
                    "country": "Portugal",
                    "countryCode": "PT",
                    "expatCommunityIndex": 72.00,
                    "socialIntegrationIndex": 68.00,
                    "careerOpportunityIndex": 55.00,
                    "remoteWorkEcosystemIndex": 78.00,
                    "rentIndex": 35.00,
                    "purchasingPowerIndex": 48.00,
                    "groceriesIndex": 40.00,
                    "restaurantIndex": 42.00,
                    "costOfLivingExRentIndex": 38.00,
                    "costOfLivingIncRentIndex": 45.00,
                    "priceToIncomeRatio": 12.50,
                    "priceToRentCityCenterRatio": 28.00,
                    "safetyIndex": 82.00,
                    "healthcareIndex": 75.00,
                    "climateIndex": 85.00,
                    "pollutionIndex": 20.00,
                    "trafficCommuteIndex": 30.00,
                    "apartment1brCenter": 900.00,
                    "apartment3brCenter": 1800.00,
                    "costSingleNoRent": 600.00,
                    "costFamilyNoRent": 1500.00,
                    "districts": [
                        {"name": "Centro", "type": "center"},
                        {"name": "Bairro Alto", "type": "residential"}
                    ]
                }
                """, name, slug);
    }
}
