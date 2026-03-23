package com.syncro.backend.integration;

import com.syncro.backend.domain.relocation.entity.RelocationCityDataset;
import com.syncro.backend.domain.relocation.repository.RelocationCityDatasetRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.math.BigDecimal;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class Sprint2IntegrationTest extends Sprint1IntegrationBaseTest {

    @Autowired
    private RelocationCityDatasetRepository cityDatasetRepository;

    private UUID testCityId;

    @BeforeEach
    void ensureTestCity() {
        var existing = cityDatasetRepository.findByCitySlugAndActiveTrue("sprint2-test-city");
        if (existing.isPresent()) {
            testCityId = existing.get().getId();
            return;
        }
        if (testCityId == null || cityDatasetRepository.findById(testCityId).isEmpty()) {
            RelocationCityDataset city = new RelocationCityDataset();
            city.setCityName("Sprint2 Test City");
            city.setCitySlug("sprint2-test-city");
            city.setCountry("Test Country");
            city.setCountryCode("TC");
            city.setExpatCommunityIndex(new BigDecimal("60"));
            city.setSocialIntegrationIndex(new BigDecimal("55"));
            city.setCareerOpportunityIndex(new BigDecimal("70"));
            city.setRemoteWorkEcosystemIndex(new BigDecimal("65"));
            city.setRentIndex(new BigDecimal("50"));
            city.setPurchasingPowerIndex(new BigDecimal("60"));
            city.setGroceriesIndex(new BigDecimal("45"));
            city.setRestaurantIndex(new BigDecimal("55"));
            city.setCostOfLivingExRentIndex(new BigDecimal("48"));
            city.setCostOfLivingIncRentIndex(new BigDecimal("52"));
            city.setPriceToIncomeRatio(new BigDecimal("10"));
            city.setPriceToRentCityCenterRatio(new BigDecimal("20"));
            city.setSafetyIndex(new BigDecimal("72"));
            city.setHealthcareIndex(new BigDecimal("78"));
            city.setClimateIndex(new BigDecimal("68"));
            city.setPollutionIndex(new BigDecimal("35"));
            city.setTrafficCommuteIndex(new BigDecimal("40"));
            city.setApartment1brCenter(new BigDecimal("900"));
            city.setApartment3brCenter(new BigDecimal("1600"));
            city.setCostSingleNoRent(new BigDecimal("500"));
            city.setCostFamilyNoRent(new BigDecimal("900"));
            city.setMacroCostoVita(new BigDecimal("60"));
            city.setMacroMercatoImmobiliare(new BigDecimal("50"));
            city.setMacroPotereEconomico(new BigDecimal("65"));
            city.setMacroQualitaVita(new BigDecimal("70"));
            city.setMacroOpportunitaLavorative(new BigDecimal("68"));
            city.setMacroIntegrazioneSociale(new BigDecimal("58"));
            city.setActive(true);
            city = cityDatasetRepository.save(city);
            testCityId = city.getId();
        }
    }

    private String createUserWithCompletedProfile() throws Exception {
        Object[] userAndToken = createUserAndGetToken();
        String token = (String) userAndToken[1];

        String profileBody = """
                {
                    "userType": "planning_move",
                    "targetCityName": "Sprint2 Test City",
                    "targetCountry": "Test Country",
                    "household": "single",
                    "monthlyBudget": 2500,
                    "primaryGoal": "career",
                    "socialPriority": "medium",
                    "desiredLifestyle": "balanced",
                    "workStatus": "employed",
                    "priorityProblem": "monthly_costs",
                    "freeNotes": "Sprint 2 integration test",
                    "completedSteps": 10
                }
                """;

        mockMvc.perform(patch("/api/v1/relocation/onboarding")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(profileBody))
                .andExpect(status().isOk());

        return token;
    }

    @Test
    @DisplayName("Budget simulation FREE flow: run and list")
    void budgetSimulation_freeFlow() throws Exception {
        String token = createUserWithCompletedProfile();

        String body = """
            {
                "planCode": "FREE",
                "cityId": "%s",
                "monthlyBudget": 2500,
                "household": "single",
                "desiredLifestyle": "balanced"
            }
            """.formatted(testCityId);

        mockMvc.perform(post("/api/v1/relocation/budget/simulations")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.planCode").value("FREE"))
                .andExpect(jsonPath("$.outputPayload.estimatedMonthlyCost").exists());

        mockMvc.perform(get("/api/v1/relocation/budget/simulations")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("Budget tracking: create entry and list")
    void budgetTracking_createAndList() throws Exception {
        Object[] userAndToken = createUserAndGetToken();
        String token = (String) userAndToken[1];

        String body = """
            {
                "category": "rent",
                "expectedValue": 1000,
                "actualValue": 1100,
                "threshold": 200
            }
            """;

        mockMvc.perform(post("/api/v1/relocation/budget/tracking")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.category").value("rent"))
                .andExpect(jsonPath("$.alertStatus").exists());

        mockMvc.perform(get("/api/v1/relocation/budget/tracking")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Starter Kit: generate and retrieve latest")
    void starterKit_generateAndGetLatest() throws Exception {
        String token = createUserWithCompletedProfile();

        mockMvc.perform(post("/api/v1/relocation/starter-kit/generate")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.payload.cityAnalysis").exists())
                .andExpect(jsonPath("$.payload.budgetAnalysis").exists())
                .andExpect(jsonPath("$.payload.quickActions").exists())
                .andExpect(jsonPath("$.payload.burnoutRisk").exists());

        mockMvc.perform(get("/api/v1/relocation/starter-kit/latest")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Risk indicators: returns risk data for user with profile")
    void riskIndicators_returns() throws Exception {
        String token = createUserWithCompletedProfile();

        mockMvc.perform(get("/api/v1/relocation/risk/indicators")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.overallRiskLevel").exists());
    }

    @Test
    @DisplayName("Budget simulation with invalid plan returns 400")
    void budgetSimulation_invalidPlan_returns400() throws Exception {
        Object[] userAndToken = createUserAndGetToken();
        String token = (String) userAndToken[1];

        String body = """
            {
                "planCode": "INVALID"
            }
            """;

        mockMvc.perform(post("/api/v1/relocation/budget/simulations")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }
}
