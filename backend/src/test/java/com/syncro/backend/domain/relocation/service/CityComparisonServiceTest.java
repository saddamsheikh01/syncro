package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.relocation.dto.CityComparisonRequest;
import com.syncro.backend.domain.relocation.dto.CityComparisonResponse;
import com.syncro.backend.domain.relocation.entity.*;
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
class CityComparisonServiceTest {

    @Mock private RelocationProfileRepository profileRepository;
    @Mock private RelocationOnboardingSnapshotRepository snapshotRepository;
    @Mock private RelocationCityDatasetRepository cityRepository;
    @Mock private RelocationCityScoreRepository scoreRepository;
    @Mock private RelocationScoringConfigRepository configRepository;
    @Mock private UserRepository userRepository;
    @Mock private ScoringCalculationHelper helper;
    @Mock private RelocationProfileResolver profileResolver;

    @InjectMocks
    private CityComparisonService service;

    private User testUser;
    private RelocationProfile testProfile;
    private RelocationOnboardingSnapshot testSnapshot;
    private RelocationScoringConfig testConfig;
    private RelocationCityDataset currentCity;
    private RelocationCityDataset targetCity;

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
        currentCity = buildCity("Milano", "milano", "Italy", "IT",
                new BigDecimal("25.00"), new BigDecimal("30.00"), new BigDecimal("70.00"),
                new BigDecimal("75.00"), new BigDecimal("65.00"), new BigDecimal("50.00"),
                new BigDecimal("1200.00"), new BigDecimal("2400.00"),
                new BigDecimal("800.00"), new BigDecimal("1600.00"));

        targetCity = buildCity("Valencia", "valencia", "Spain", "ES",
                new BigDecimal("60.00"), new BigDecimal("55.00"), new BigDecimal("45.00"),
                new BigDecimal("80.00"), new BigDecimal("50.00"), new BigDecimal("70.00"),
                new BigDecimal("700.00"), new BigDecimal("1400.00"),
                new BigDecimal("500.00"), new BigDecimal("1000.00"));
    }

    @Test
    @DisplayName("compareCities returns correct macroaree deltas between two cities")
    void compareCities_returnsCorrectDeltas() {
        stubCommonDependencies();

        CityComparisonRequest request = new CityComparisonRequest(currentCity.getId(), targetCity.getId());
        CityComparisonResponse response = service.compareCities(testUser.getId(), request);

        assertThat(response).isNotNull();
        assertThat(response.currentCity().name()).isEqualTo("Milano");
        assertThat(response.targetCity().name()).isEqualTo("Valencia");
        assertThat(response.macroareeComparison()).hasSize(6);
        assertThat(response.algorithmVersion()).isEqualTo("1.0");

        // costo_vita: target 60 - current 25 = +35 → improvement
        var costoVita = response.macroareeComparison().stream()
                .filter(c -> "costo_vita".equals(c.macroarea())).findFirst().orElseThrow();
        assertThat(costoVita.delta()).isEqualByComparingTo(new BigDecimal("35.00"));
        assertThat(costoVita.direction()).isEqualTo("improvement");

        verify(scoreRepository).save(any(RelocationCityScore.class));
    }

    @Test
    @DisplayName("compareCities calculates economic impact for single household")
    void compareCities_singleHousehold_economicImpact() {
        stubCommonDependencies();
        when(helper.isFamily(anyMap())).thenReturn(false);
        when(helper.computeCityCost(currentCity, false)).thenReturn(new BigDecimal("2000.00"));
        when(helper.computeCityCost(targetCity, false)).thenReturn(new BigDecimal("1200.00"));

        CityComparisonRequest request = new CityComparisonRequest(currentCity.getId(), targetCity.getId());
        CityComparisonResponse response = service.compareCities(testUser.getId(), request);

        assertThat(response.economicImpact()).isNotNull();
        assertThat(response.economicImpact().isFamily()).isFalse();
        assertThat(response.economicImpact().monthlySaving()).isEqualByComparingTo(new BigDecimal("800.00"));
        assertThat(response.economicImpact().summary()).contains("reduce");
    }

    @Test
    @DisplayName("compareCities calculates economic impact for family household")
    void compareCities_familyHousehold_economicImpact() {
        testSnapshot.setPayload(buildFamilyPayload());
        stubCommonDependencies();
        when(helper.isFamily(anyMap())).thenReturn(true);
        when(helper.computeCityCost(currentCity, true)).thenReturn(new BigDecimal("4000.00"));
        when(helper.computeCityCost(targetCity, true)).thenReturn(new BigDecimal("2400.00"));

        CityComparisonRequest request = new CityComparisonRequest(currentCity.getId(), targetCity.getId());
        CityComparisonResponse response = service.compareCities(testUser.getId(), request);

        assertThat(response.economicImpact().isFamily()).isTrue();
        assertThat(response.economicImpact().monthlySaving()).isEqualByComparingTo(new BigDecimal("1600.00"));
    }

    @Test
    @DisplayName("compareCities detects priority alignment for HIGH+ priorities")
    void compareCities_priorityAlignment_highPriorities() {
        stubCommonDependencies();
        // qualita_vita is HIGH and target(80) > current(75) → aligned
        // costo_vita is VERY_HIGH and target(60) > current(25) → aligned

        CityComparisonRequest request = new CityComparisonRequest(currentCity.getId(), targetCity.getId());
        CityComparisonResponse response = service.compareCities(testUser.getId(), request);

        assertThat(response.priorityAlignment()).isNotNull();
        assertThat(response.priorityAlignment().alignedPriorities()).isNotNull();
    }

    @Test
    @DisplayName("compareCities generates trade-offs where current city is stronger")
    void compareCities_generatesTradeOffs() {
        stubCommonDependencies();
        // potere_economico: current=70, target=45 → diff=25 >= 5 → trade-off
        // opportunita_lavorative: current=65, target=50 → diff=15 >= 5 → trade-off

        CityComparisonRequest request = new CityComparisonRequest(currentCity.getId(), targetCity.getId());
        CityComparisonResponse response = service.compareCities(testUser.getId(), request);

        assertThat(response.tradeOffs()).isNotNull();
        List<String> tradeOffKeys = response.tradeOffs().stream()
                .map(CityComparisonResponse.TradeOff::macroarea).toList();
        assertThat(tradeOffKeys).contains("potere_economico");
        assertThat(tradeOffKeys).contains("opportunita_lavorative");
    }

    @Test
    @DisplayName("compareCities computes overall impact with fit scores for both cities")
    void compareCities_overallImpact() {
        stubCommonDependencies();
        when(helper.computeCityFitScore(eq(currentCity), anyMap(), any(), anyMap())).thenReturn(62);
        when(helper.computeCityFitScore(eq(targetCity), anyMap(), any(), anyMap())).thenReturn(75);
        when(helper.classifyCompatibility(62, testConfig)).thenReturn("MODERATE_FIT");
        when(helper.classifyCompatibility(75, testConfig)).thenReturn("GOOD_FIT");

        CityComparisonRequest request = new CityComparisonRequest(currentCity.getId(), targetCity.getId());
        CityComparisonResponse response = service.compareCities(testUser.getId(), request);

        assertThat(response.overallImpact()).isNotNull();
        assertThat(response.overallImpact().scoreCurrentCity()).isEqualTo(62);
        assertThat(response.overallImpact().scoreTargetCity()).isEqualTo(75);
        assertThat(response.overallImpact().compatibilityLevelCurrent()).isEqualTo("MODERATE_FIT");
        assertThat(response.overallImpact().compatibilityLevelTarget()).isEqualTo("GOOD_FIT");
    }

    @Test
    @DisplayName("compareCities throws NOT_FOUND when city not found")
    void compareCities_cityNotFound_throwsNotFound() {
        UUID fakeCityId = UUID.randomUUID();

        when(profileResolver.findOrRecover(testUser.getId())).thenReturn(testProfile);
        when(snapshotRepository.findByUserIdAndIsActiveTrue(testUser.getId())).thenReturn(Optional.of(testSnapshot));
        when(configRepository.findByConfigKeyAndActiveTrue("city_scoring_v1")).thenReturn(Optional.of(testConfig));
        when(cityRepository.findById(fakeCityId)).thenReturn(Optional.empty());

        CityComparisonRequest request = new CityComparisonRequest(fakeCityId, targetCity.getId());

        assertThatThrownBy(() -> service.compareCities(testUser.getId(), request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Current city not found");
    }

    @Test
    @DisplayName("compareCities throws CONFLICT when no active snapshot")
    void compareCities_noSnapshot_throwsConflict() {
        when(profileResolver.findOrRecover(testUser.getId())).thenReturn(testProfile);
        when(snapshotRepository.findByUserIdAndIsActiveTrue(testUser.getId())).thenReturn(Optional.empty());

        CityComparisonRequest request = new CityComparisonRequest(currentCity.getId(), targetCity.getId());

        assertThatThrownBy(() -> service.compareCities(testUser.getId(), request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("No active snapshot found");
    }

    // ========== HELPERS ==========

    private void stubCommonDependencies() {
        when(profileResolver.findOrRecover(testUser.getId())).thenReturn(testProfile);
        when(snapshotRepository.findByUserIdAndIsActiveTrue(testUser.getId())).thenReturn(Optional.of(testSnapshot));
        when(configRepository.findByConfigKeyAndActiveTrue("city_scoring_v1")).thenReturn(Optional.of(testConfig));
        when(cityRepository.findById(currentCity.getId())).thenReturn(Optional.of(currentCity));
        when(cityRepository.findById(targetCity.getId())).thenReturn(Optional.of(targetCity));

        // Default weights and classification
        Map<String, Double> normalizedWeights = Map.of(
                "costo_vita", 0.20, "mercato_immobiliare", 0.15,
                "potere_economico", 0.18, "qualita_vita", 0.17,
                "opportunita_lavorative", 0.18, "integrazione_sociale", 0.12);

        Map<String, String> priorityClassification = Map.of(
                "costo_vita", "VERY_HIGH", "mercato_immobiliare", "MEDIUM",
                "potere_economico", "HIGH", "qualita_vita", "HIGH",
                "opportunita_lavorative", "HIGH", "integrazione_sociale", "MEDIUM");

        when(helper.accumulateUserWeights(anyMap())).thenReturn(new LinkedHashMap<>(normalizedWeights));
        when(helper.normalizeWeights(anyMap())).thenReturn(normalizedWeights);
        when(helper.classifyPriorities(anyMap(), any())).thenReturn(priorityClassification);

        // City macroaree maps
        when(helper.getCityMacroareeMap(currentCity)).thenReturn(Map.of(
                "costo_vita", new BigDecimal("25.00"),
                "mercato_immobiliare", new BigDecimal("30.00"),
                "potere_economico", new BigDecimal("70.00"),
                "qualita_vita", new BigDecimal("75.00"),
                "opportunita_lavorative", new BigDecimal("65.00"),
                "integrazione_sociale", new BigDecimal("50.00")));

        when(helper.getCityMacroareeMap(targetCity)).thenReturn(Map.of(
                "costo_vita", new BigDecimal("60.00"),
                "mercato_immobiliare", new BigDecimal("55.00"),
                "potere_economico", new BigDecimal("45.00"),
                "qualita_vita", new BigDecimal("80.00"),
                "opportunita_lavorative", new BigDecimal("50.00"),
                "integrazione_sociale", new BigDecimal("70.00")));

        // Economic defaults
        lenient().when(helper.isFamily(anyMap())).thenReturn(false);
        lenient().when(helper.computeCityCost(currentCity, false)).thenReturn(new BigDecimal("2000.00"));
        lenient().when(helper.computeCityCost(targetCity, false)).thenReturn(new BigDecimal("1200.00"));

        // Scoring defaults
        lenient().when(helper.computeCityFitScore(eq(currentCity), anyMap(), any(), anyMap())).thenReturn(55);
        lenient().when(helper.computeCityFitScore(eq(targetCity), anyMap(), any(), anyMap())).thenReturn(70);
        lenient().when(helper.classifyCompatibility(anyInt(), any())).thenReturn("GOOD_FIT");

        when(userRepository.getReferenceById(testUser.getId())).thenReturn(testUser);
        when(scoreRepository.save(any(RelocationCityScore.class))).thenAnswer(inv -> inv.getArgument(0));
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

    private Map<String, Object> buildFamilyPayload() {
        Map<String, Object> payload = buildTestPayload();
        payload.put("household", "with_children");
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

    private RelocationCityDataset buildCity(String name, String slug, String country, String countryCode,
                                             BigDecimal costoVita, BigDecimal mercatoImm, BigDecimal potereEco,
                                             BigDecimal qualitaVita, BigDecimal oppLav, BigDecimal intSoc,
                                             BigDecimal apt1br, BigDecimal apt3br,
                                             BigDecimal costSingle, BigDecimal costFamily) {
        RelocationCityDataset city = new RelocationCityDataset();
        city.setId(UUID.randomUUID());
        city.setCityName(name);
        city.setCitySlug(slug);
        city.setCountry(country);
        city.setCountryCode(countryCode);
        city.setActive(true);

        city.setMacroCostoVita(costoVita);
        city.setMacroMercatoImmobiliare(mercatoImm);
        city.setMacroPotereEconomico(potereEco);
        city.setMacroQualitaVita(qualitaVita);
        city.setMacroOpportunitaLavorative(oppLav);
        city.setMacroIntegrazioneSociale(intSoc);

        city.setApartment1brCenter(apt1br);
        city.setApartment3brCenter(apt3br);
        city.setCostSingleNoRent(costSingle);
        city.setCostFamilyNoRent(costFamily);

        return city;
    }
}
