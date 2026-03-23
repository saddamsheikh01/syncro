package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.relocation.dto.BudgetSimulationResponse;
import com.syncro.backend.domain.relocation.dto.CreateBudgetSimulationRequest;
import com.syncro.backend.domain.relocation.entity.BudgetSimulation;
import com.syncro.backend.domain.relocation.entity.RelocationCityDataset;
import com.syncro.backend.domain.relocation.entity.RelocationProfile;
import com.syncro.backend.domain.relocation.entity.RelocationScoringConfig;
import com.syncro.backend.domain.relocation.mapper.RelocationMapper;
import com.syncro.backend.domain.relocation.repository.BudgetSimulationRepository;
import com.syncro.backend.domain.relocation.repository.RelocationCityDatasetRepository;
import com.syncro.backend.domain.relocation.repository.RelocationProfileRepository;
import com.syncro.backend.domain.relocation.repository.RelocationScoringConfigRepository;
import com.syncro.backend.domain.analytics.service.AnalyticsService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BudgetSimulationServiceTest {

    @Mock private BudgetSimulationRepository simulationRepository;
    @Mock private RelocationProfileRepository profileRepository;
    @Mock private RelocationCityDatasetRepository cityDatasetRepository;
    @Mock private RelocationScoringConfigRepository scoringConfigRepository;
    @Mock private ScoringCalculationHelper scoringHelper;
    @Mock private RelocationMapper mapper;
    @Mock private AnalyticsService analyticsService;
    @Mock private UserRepository userRepository;
    @InjectMocks private BudgetSimulationService service;

    @Test
    void runSimulation_free_returnsResponse() {
        User user = mockUser();
        RelocationProfile profile = mockProfile();
        RelocationCityDataset city = mockCity();
        RelocationScoringConfig config = mockConfig();

        when(profileRepository.findByUserId(user.getId())).thenReturn(Optional.of(profile));
        when(cityDatasetRepository.findById(city.getId())).thenReturn(Optional.of(city));
        when(scoringConfigRepository.findByConfigKeyAndActiveTrue("city_scoring_v1")).thenReturn(Optional.of(config));
        when(scoringHelper.isFamily(any())).thenReturn(false);
        when(scoringHelper.computeCityCost(any(), eq(false))).thenReturn(new BigDecimal("1500"));
        when(scoringHelper.getLifestyleMultiplier(any(), any())).thenReturn(BigDecimal.ONE);
        when(scoringHelper.classifyMarginStatus(any(), any())).thenReturn("sustainable");
        when(simulationRepository.save(any())).thenAnswer(inv -> {
            BudgetSimulation sim = inv.getArgument(0);
            sim.setId(UUID.randomUUID());
            sim.setCreatedAt(Instant.now());
            return sim;
        });
        BudgetSimulationResponse mockResp = mock(BudgetSimulationResponse.class);
        when(mapper.toBudgetSimulationResponse(any())).thenReturn(mockResp);

        CreateBudgetSimulationRequest request = new CreateBudgetSimulationRequest(
                "FREE", city.getId(), new BigDecimal("2500"), "single", "balanced", null, null);

        BudgetSimulationResponse result = service.runSimulation(user.getId(), request);
        assertNotNull(result);
        verify(simulationRepository).save(any());
        verify(analyticsService).trackServerEventSafe(eq(user.getId()), eq("BUDGET_SIMULATION_RUN"), any());
    }

    @Test
    void runSimulation_invalidPlan_throwsBadRequest() {
        CreateBudgetSimulationRequest request = new CreateBudgetSimulationRequest(
                "INVALID", null, null, null, null, null, null);
        User user = mock(User.class);
        assertThrows(BadRequestException.class, () -> service.runSimulation(user.getId(), request));
    }

    @Test
    void runSimulation_premium_requiresIncome() {
        User user = mockUser();
        RelocationProfile profile = mockProfile();
        RelocationCityDataset city = mockCity();
        RelocationScoringConfig config = mockConfig();

        when(profileRepository.findByUserId(user.getId())).thenReturn(Optional.of(profile));
        when(cityDatasetRepository.findById(city.getId())).thenReturn(Optional.of(city));
        when(scoringConfigRepository.findByConfigKeyAndActiveTrue("city_scoring_v1")).thenReturn(Optional.of(config));
        when(scoringHelper.isFamily(any())).thenReturn(false);
        when(scoringHelper.computeCityCost(any(), eq(false))).thenReturn(new BigDecimal("1500"));
        when(scoringHelper.getLifestyleMultiplier(any(), any())).thenReturn(BigDecimal.ONE);
        when(scoringHelper.classifyMarginStatus(any(), any())).thenReturn("sustainable");

        CreateBudgetSimulationRequest request = new CreateBudgetSimulationRequest(
                "PREMIUM", city.getId(), new BigDecimal("2500"), "single", "balanced", null, null);

        assertThrows(BadRequestException.class, () -> service.runSimulation(user.getId(), request));
    }

    @Test
    void runSimulation_superPro_includesProjections() {
        User user = mockUser();
        RelocationProfile profile = mockProfile();
        RelocationCityDataset city = mockCity();
        RelocationScoringConfig config = mockConfig();

        when(profileRepository.findByUserId(user.getId())).thenReturn(Optional.of(profile));
        when(cityDatasetRepository.findById(city.getId())).thenReturn(Optional.of(city));
        when(scoringConfigRepository.findByConfigKeyAndActiveTrue("city_scoring_v1")).thenReturn(Optional.of(config));
        when(scoringHelper.isFamily(any())).thenReturn(false);
        when(scoringHelper.computeCityCost(any(), eq(false))).thenReturn(new BigDecimal("1500"));
        when(scoringHelper.getLifestyleMultiplier(any(), any())).thenReturn(BigDecimal.ONE);
        when(scoringHelper.classifyMarginStatus(any(), any())).thenReturn("sustainable");
        when(simulationRepository.save(any())).thenAnswer(inv -> {
            BudgetSimulation sim = inv.getArgument(0);
            sim.setId(UUID.randomUUID());
            sim.setCreatedAt(Instant.now());
            return sim;
        });
        BudgetSimulationResponse mockResp = mock(BudgetSimulationResponse.class);
        when(mapper.toBudgetSimulationResponse(any())).thenReturn(mockResp);

        CreateBudgetSimulationRequest request = new CreateBudgetSimulationRequest(
                "SUPER_PRO", city.getId(), new BigDecimal("2500"), "single", "balanced", new BigDecimal("4000"), 6);

        BudgetSimulationResponse result = service.runSimulation(user.getId(), request);
        assertNotNull(result);
        verify(simulationRepository).save(argThat(sim ->
                "SUPER_PRO".equals(sim.getPlanCode()) && sim.getOutputPayload() != null));
    }

    @Test
    void runSimulation_noProfile_throwsNotFound() {
        User user = mockUser();
        when(profileRepository.findByUserId(user.getId())).thenReturn(Optional.empty());

        CreateBudgetSimulationRequest request = new CreateBudgetSimulationRequest(
                "FREE", null, null, null, null, null, null);

        assertThrows(NotFoundException.class, () -> service.runSimulation(user.getId(), request));
    }

    @Test
    void getSimulations_returnsList() {
        User user = mockUser();
        when(simulationRepository.findByUser_IdOrderByCreatedAtDesc(user.getId())).thenReturn(List.of());
        List<BudgetSimulationResponse> result = service.getSimulations(user.getId());
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    private User mockUser() {
        User user = mock(User.class);
        when(user.getId()).thenReturn(UUID.randomUUID());
        return user;
    }

    private RelocationProfile mockProfile() {
        RelocationProfile profile = mock(RelocationProfile.class);
        lenient().when(profile.getMonthlyBudget()).thenReturn(new BigDecimal("2500"));
        lenient().when(profile.getHousehold()).thenReturn("single");
        lenient().when(profile.getDesiredLifestyle()).thenReturn("balanced");
        lenient().when(profile.getUserType()).thenReturn("planning_move");
        RelocationCityDataset city = mockCity();
        lenient().when(profile.getTargetCity()).thenReturn(city);
        return profile;
    }

    private RelocationCityDataset mockCity() {
        RelocationCityDataset city = mock(RelocationCityDataset.class);
        lenient().when(city.getId()).thenReturn(UUID.randomUUID());
        lenient().when(city.getCityName()).thenReturn("Barcelona");
        lenient().when(city.getCountry()).thenReturn("Spain");
        lenient().when(city.getApartment1brCenter()).thenReturn(new BigDecimal("1000"));
        lenient().when(city.getApartment3brCenter()).thenReturn(new BigDecimal("1800"));
        lenient().when(city.getCostSingleNoRent()).thenReturn(new BigDecimal("500"));
        lenient().when(city.getCostFamilyNoRent()).thenReturn(new BigDecimal("900"));
        return city;
    }

    private RelocationScoringConfig mockConfig() {
        RelocationScoringConfig config = mock(RelocationScoringConfig.class);
        lenient().when(config.getBudgetMarginThresholds()).thenReturn(Map.of("sustainable", 400, "tight", 100, "very_tight", 0));
        lenient().when(config.getLifestyleMultipliers()).thenReturn(Map.of("essential", 0.9, "balanced", 1.0, "premium", 1.2));
        return config;
    }
}
