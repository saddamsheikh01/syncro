package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.domain.analytics.service.AnalyticsService;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.relocation.dto.ComputeScoringRequest;
import com.syncro.backend.domain.relocation.dto.ScoringResultResponse;
import com.syncro.backend.domain.relocation.entity.*;
import com.syncro.backend.domain.relocation.mapper.RelocationMapper;
import com.syncro.backend.domain.relocation.repository.*;
import com.syncro.backend.domain.relocation.service.RelocationProfileResolver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RelocationScoringServiceTest {

    @Mock private RelocationProfileRepository profileRepository;
    @Mock private RelocationOnboardingSnapshotRepository snapshotRepository;
    @Mock private RelocationCityDatasetRepository cityRepository;
    @Mock private RelocationCityScoreRepository scoreRepository;
    @Mock private RelocationScoringConfigRepository configRepository;
    @Mock private UserRepository userRepository;
    @Mock private RelocationMapper mapper;
    @Mock private AnalyticsService analyticsService;
    @Mock private ScoringCalculationHelper helper;
    @Mock private RelocationProfileResolver profileResolver;

    @InjectMocks
    private RelocationScoringService service;

    private User testUser;
    private RelocationProfile testProfile;
    private RelocationOnboardingSnapshot testSnapshot;
    private RelocationScoringConfig testConfig;
    private RelocationCityDataset testCity;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());

        testProfile = new RelocationProfile();
        testProfile.setId(UUID.randomUUID());
        testProfile.setUser(testUser);
        testProfile.setUserType("planning_move");
        testProfile.setStatus("COMPLETED");

        testSnapshot = new RelocationOnboardingSnapshot();
        testSnapshot.setId(UUID.randomUUID());
        testSnapshot.setUser(testUser);
        testSnapshot.setVersion(1);
        testSnapshot.setIsActive(true);
        testSnapshot.setPayload(buildTestPayload());

        testConfig = buildTestConfig();
        testCity = buildTestCity();
    }

    @Test
    @DisplayName("computeScoring for planning_move scores all active cities")
    void computeScoring_planningMove_scoresAllCities() {
        RelocationCityDataset city2 = buildTestCity();
        city2.setCityName("Berlin");
        city2.setCitySlug("berlin");

        when(profileResolver.findOrRecover(testUser.getId())).thenReturn(testProfile);
        when(snapshotRepository.findByUserIdAndIsActiveTrue(testUser.getId())).thenReturn(Optional.of(testSnapshot));
        when(configRepository.findByConfigKeyAndActiveTrue("city_scoring_v1")).thenReturn(Optional.of(testConfig));
        when(cityRepository.findByActiveTrue()).thenReturn(List.of(testCity, city2));
        when(scoreRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        stubHelperDefaults();
        when(userRepository.getReferenceById(testUser.getId())).thenReturn(testUser);

        ScoringResultResponse result = service.computeScoring(testUser.getId(), null);

        assertThat(result).isNotNull();
        assertThat(result.analysisType()).isEqualTo("planning_move");
        assertThat(result.algorithmVersion()).isEqualTo("1.0");

        verify(scoreRepository).saveAll(argThat(list -> ((List<?>) list).size() == 2));
        verify(analyticsService).trackServerEventSafe(eq(testUser.getId()), eq("CITY_SCORING_COMPUTED"), anyMap());
    }

    @Test
    @DisplayName("computeScoring throws NOT_FOUND when profile doesn't exist")
    void computeScoring_noProfile_throwsNotFound() {
        when(profileResolver.findOrRecover(testUser.getId()))
                .thenThrow(new ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Relocation profile not found"));

        assertThatThrownBy(() -> service.computeScoring(testUser.getId(), null))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Relocation profile not found");
    }

    @Test
    @DisplayName("computeScoring throws CONFLICT when no active snapshot")
    void computeScoring_noSnapshot_throwsConflict() {
        when(profileResolver.findOrRecover(testUser.getId())).thenReturn(testProfile);
        when(snapshotRepository.findByUserIdAndIsActiveTrue(testUser.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.computeScoring(testUser.getId(), null))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("No active snapshot found");
    }

    @Test
    @DisplayName("computeScoring for chosen_city scores only the target city")
    void computeScoring_chosenCity_scoresTargetOnly() {
        testProfile.setUserType("chosen_city");
        testProfile.setTargetCity(testCity);
        testCity.setId(UUID.randomUUID());

        when(profileResolver.findOrRecover(testUser.getId())).thenReturn(testProfile);
        when(snapshotRepository.findByUserIdAndIsActiveTrue(testUser.getId())).thenReturn(Optional.of(testSnapshot));
        when(configRepository.findByConfigKeyAndActiveTrue("city_scoring_v1")).thenReturn(Optional.of(testConfig));
        when(cityRepository.findById(testCity.getId())).thenReturn(Optional.of(testCity));
        when(scoreRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        stubHelperDefaults();
        when(userRepository.getReferenceById(testUser.getId())).thenReturn(testUser);

        ComputeScoringRequest request = new ComputeScoringRequest(testCity.getId(), "chosen_city");
        ScoringResultResponse result = service.computeScoring(testUser.getId(), request);

        assertThat(result).isNotNull();
        assertThat(result.analysisType()).isEqualTo("chosen_city");

        verify(scoreRepository).saveAll(argThat(list -> ((List<?>) list).size() == 1));
    }

    @Test
    @DisplayName("getHistory returns scores ordered by createdAt")
    void getHistory_returnsOrdered() {
        when(scoreRepository.findByUserIdOrderByCreatedAtDesc(testUser.getId())).thenReturn(List.of());

        var result = service.getHistory(testUser.getId());

        assertThat(result).isEmpty();
        verify(scoreRepository).findByUserIdOrderByCreatedAtDesc(testUser.getId());
    }

    // ========== U7: Missing method tests ==========

    @Test
    @DisplayName("getLatestScores returns scores for user and snapshot")
    void getLatestScores_returnsForUserAndSnapshot() {
        UUID snapshotId = testSnapshot.getId();

        when(scoreRepository.findByUserIdAndSnapshotIdOrderByRankingPositionAsc(testUser.getId(), snapshotId))
                .thenReturn(List.of());

        var result = service.getLatestScores(testUser.getId(), snapshotId);

        assertThat(result).isEmpty();
        verify(scoreRepository).findByUserIdAndSnapshotIdOrderByRankingPositionAsc(testUser.getId(), snapshotId);
    }

    // ========== HELPERS ==========

    private void stubHelperDefaults() {
        Map<String, Double> normalizedWeights = Map.of(
                "costo_vita", 0.20, "mercato_immobiliare", 0.15,
                "potere_economico", 0.18, "qualita_vita", 0.17,
                "opportunita_lavorative", 0.18, "integrazione_sociale", 0.12);
        Map<String, String> priorityClassification = Map.of(
                "costo_vita", "HIGH", "mercato_immobiliare", "MEDIUM",
                "potere_economico", "HIGH", "qualita_vita", "HIGH",
                "opportunita_lavorative", "HIGH", "integrazione_sociale", "MEDIUM");
        Map<String, BigDecimal> cityMacroaree = Map.of(
                "costo_vita", new BigDecimal("55.50"), "mercato_immobiliare", new BigDecimal("48.85"),
                "potere_economico", new BigDecimal("65.00"), "qualita_vita", new BigDecimal("72.00"),
                "opportunita_lavorative", new BigDecimal("57.50"), "integrazione_sociale", new BigDecimal("70.00"));

        when(helper.accumulateUserWeights(anyMap())).thenReturn(new LinkedHashMap<>(normalizedWeights));
        when(helper.normalizeWeights(anyMap())).thenReturn(normalizedWeights);
        when(helper.classifyPriorities(anyMap(), any())).thenReturn(priorityClassification);
        when(helper.computeCityFitScore(any(), anyMap(), any(), anyMap())).thenReturn(70);
        when(helper.computeBudgetCheck(any(), any(), anyMap())).thenReturn(Map.of("marginStatus", "sustainable"));
        when(helper.generateInsights(any(), anyMap(), any())).thenReturn(Map.of("insights", List.of()));
        when(helper.getCityMacroareeMap(any())).thenReturn(cityMacroaree);
        when(helper.classifyCompatibility(anyInt(), any())).thenReturn("GOOD_FIT");
        when(mapper.toCityScoreResponse(any())).thenReturn(null);
    }

    private Map<String, Object> buildTestPayload() {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("userType", "planning_move");
        payload.put("household", "single");
        payload.put("hasPets", false);
        payload.put("monthlyBudget", 2500);
        payload.put("primaryGoal", "career");
        payload.put("desiredLifestyle", "balanced");
        payload.put("workStatus", "employed");
        payload.put("isRemote", false);
        payload.put("priorityProblem", "monthly_costs");
        return payload;
    }

    private RelocationScoringConfig buildTestConfig() {
        RelocationScoringConfig config = new RelocationScoringConfig();
        config.setId(UUID.randomUUID());
        config.setConfigKey("city_scoring_v1");
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
        return config;
    }

    private RelocationCityDataset buildTestCity() {
        RelocationCityDataset city = new RelocationCityDataset();
        city.setCityName("Lisbon");
        city.setCitySlug("lisbon");
        city.setCountry("Portugal");
        city.setCountryCode("PT");
        city.setActive(true);

        city.setExpatCommunityIndex(new BigDecimal("72.00"));
        city.setSocialIntegrationIndex(new BigDecimal("68.00"));
        city.setCareerOpportunityIndex(new BigDecimal("60.00"));
        city.setRemoteWorkEcosystemIndex(new BigDecimal("55.00"));

        city.setRentIndex(new BigDecimal("35.00"));
        city.setPurchasingPowerIndex(new BigDecimal("65.00"));
        city.setGroceriesIndex(new BigDecimal("40.00"));
        city.setRestaurantIndex(new BigDecimal("50.00"));
        city.setCostOfLivingExRentIndex(new BigDecimal("45.00"));
        city.setCostOfLivingIncRentIndex(new BigDecimal("42.00"));

        city.setPriceToIncomeRatio(new BigDecimal("10.50"));
        city.setPriceToRentCityCenterRatio(new BigDecimal("20.00"));

        city.setSafetyIndex(new BigDecimal("70.00"));
        city.setHealthcareIndex(new BigDecimal("75.00"));
        city.setClimateIndex(new BigDecimal("80.00"));
        city.setPollutionIndex(new BigDecimal("30.00"));
        city.setTrafficCommuteIndex(new BigDecimal("35.00"));

        city.setApartment1brCenter(new BigDecimal("900.00"));
        city.setApartment3brCenter(new BigDecimal("1800.00"));
        city.setCostSingleNoRent(new BigDecimal("600.00"));
        city.setCostFamilyNoRent(new BigDecimal("1200.00"));

        // Pre-computed macroaree
        city.setMacroCostoVita(new BigDecimal("55.50"));
        city.setMacroMercatoImmobiliare(new BigDecimal("48.85"));
        city.setMacroPotereEconomico(new BigDecimal("65.00"));
        city.setMacroQualitaVita(new BigDecimal("72.00"));
        city.setMacroOpportunitaLavorative(new BigDecimal("57.50"));
        city.setMacroIntegrazioneSociale(new BigDecimal("70.00"));

        return city;
    }

}
