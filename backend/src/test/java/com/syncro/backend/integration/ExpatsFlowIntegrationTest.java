package com.syncro.backend.integration;

import com.syncro.backend.domain.relocation.entity.RelocationCityDataset;
import com.syncro.backend.domain.relocation.repository.RelocationCityDatasetRepository;
import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for the Expats funnel flow: config, anonymous sessions, conversion.
 */
class ExpatsFlowIntegrationTest extends Sprint1IntegrationBaseTest {

    @Autowired
    private RelocationCityDatasetRepository cityDatasetRepository;

    private UUID testCityId;

    @BeforeEach
    void ensureTestCity() {
        var existing = cityDatasetRepository.findByCitySlugAndActiveTrue("expats-convert-test-city");
        if (existing.isPresent()) {
            testCityId = existing.get().getId();
            return;
        }

        RelocationCityDataset city = new RelocationCityDataset();
        city.setCityName("Expats Convert Test City");
        city.setCitySlug("expats-convert-test-city");
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

    @Test
    @DisplayName("GET funnel config returns 404 when no config seeded")
    void getFunnelConfig_noSeed_returns404() throws Exception {
        mockMvc.perform(get("/api/v1/expats/funnel/config")
                        .param("configKey", "nonexistent_key")
                        .param("language", "en"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST anonymous session returns 200 with session token and IN_PROGRESS status")
    void createAnonymousSession_returns200() throws Exception {
        mockMvc.perform(post("/api/v1/expats/anonymous/sessions")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionToken").isNotEmpty())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.currentStep").value(1))
                .andExpect(jsonPath("$.totalSteps").value(10));
    }

    @Test
    @DisplayName("PATCH anonymous session with answers advances step and saves answer")
    void patchSession_advancesStep() throws Exception {
        // First create a session
        String createResult = mockMvc.perform(post("/api/v1/expats/anonymous/sessions")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String sessionId = objectMapper.readTree(createResult).get("id").asText();

        // Now update the session with an answer
        String updateBody = """
                {
                    "stepNumber": 1,
                    "questionGroup": "city_fit",
                    "questionKey": "user_phase",
                    "answerValue": "planning_move"
                }
                """;

        mockMvc.perform(patch("/api/v1/expats/anonymous/sessions/" + sessionId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentStep").value(1));
    }

    @Test
    @DisplayName("GET anonymous session returns full state with answers")
    void getSession_returnsFullState() throws Exception {
        // Create session
        String createResult = mockMvc.perform(post("/api/v1/expats/anonymous/sessions")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String sessionId = objectMapper.readTree(createResult).get("id").asText();

        // Retrieve session
        mockMvc.perform(get("/api/v1/expats/anonymous/sessions/" + sessionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(sessionId))
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }

    @Test
    @DisplayName("GET session with non-existent ID returns 404")
    void getSession_nonExistent_returns404() throws Exception {
        mockMvc.perform(get("/api/v1/expats/anonymous/sessions/00000000-0000-0000-0000-000000000001"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST convert without auth returns 401 UNAUTHORIZED")
    void convertSession_noAuth_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/expats/anonymous/convert")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sessionToken\":\"test-token\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST convert with auth and valid session returns 200")
    void convertSession_withAuth_returns200() throws Exception {
        // Create a session first
        String createResult = mockMvc.perform(post("/api/v1/expats/anonymous/sessions")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String sessionToken = objectMapper.readTree(createResult).get("sessionToken").asText();

        // Create user and get token
        Object[] userAndToken = createUserAndGetToken();
        String jwtToken = (String) userAndToken[1];

        // Convert
        String convertBody = String.format("{\"sessionToken\":\"%s\"}", sessionToken);

        mockMvc.perform(post("/api/v1/expats/anonymous/convert")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(convertBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("converted"));
    }

    @Test
    @DisplayName("POST convert syncs city selection into registered relocation profile")
    void convertSession_syncsCitySelectionIntoRelocationProfile() throws Exception {
        String createResult = mockMvc.perform(post("/api/v1/expats/anonymous/sessions")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String sessionId = objectMapper.readTree(createResult).get("id").asText();
        String sessionToken = objectMapper.readTree(createResult).get("sessionToken").asText();

        mockMvc.perform(patch("/api/v1/expats/anonymous/sessions/" + sessionId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "stepNumber": 1,
                                    "questionGroup": "city_fit",
                                    "questionKey": "user_phase",
                                    "answerValue": "planning_move"
                                }
                                """))
                .andExpect(status().isOk());

        String citySelectionBody = """
                {
                    "stepNumber": 2,
                    "questionGroup": "city_fit",
                    "questionKey": "city_selection",
                    "answerValue": {
                        "targetCityId": "%s",
                        "targetCityName": "Wrong Free Text"
                    }
                }
                """.formatted(testCityId);

        mockMvc.perform(patch("/api/v1/expats/anonymous/sessions/" + sessionId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(citySelectionBody))
                .andExpect(status().isOk());

        Object[] userAndToken = createUserAndGetToken();
        String jwtToken = (String) userAndToken[1];

        String convertBody = String.format("{\"sessionToken\":\"%s\"}", sessionToken);

        mockMvc.perform(post("/api/v1/expats/anonymous/convert")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(convertBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("converted"));

        mockMvc.perform(get("/api/v1/relocation/onboarding")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userType").value("planning_move"))
                .andExpect(jsonPath("$.targetCityId").value(testCityId.toString()))
                .andExpect(jsonPath("$.targetCityName").value("Expats Convert Test City"))
                .andExpect(jsonPath("$.completedSteps").isNumber());
    }
}
