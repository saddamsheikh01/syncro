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
import com.syncro.backend.domain.relocation.mapper.RelocationMapper;
import com.syncro.backend.domain.relocation.repository.BudgetSimulationRepository;
import com.syncro.backend.domain.relocation.repository.RelocationCityDatasetRepository;
import com.syncro.backend.domain.relocation.repository.RelocationProfileRepository;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BudgetSimulationServiceTest {

    @Mock private BudgetSimulationRepository simulationRepository;
    @Mock private RelocationProfileRepository profileRepository;
    @Mock private RelocationCityDatasetRepository cityDatasetRepository;
    @Mock private BudgetCalculationHelper calcHelper;
    @Mock private RelocationMapper mapper;
    @Mock private AnalyticsService analyticsService;
    @Mock private UserRepository userRepository;
    @InjectMocks private BudgetSimulationService service;

    @Test
    void runSimulation_free_returnsResponse() {
        User user = mockUser();
        RelocationProfile profile = mockProfile();
        RelocationCityDataset city = mockCity();

        when(profileRepository.findByUserId(user.getId())).thenReturn(Optional.of(profile));
        when(cityDatasetRepository.findById(city.getId())).thenReturn(Optional.of(city));
        when(calcHelper.resolveRent(any(), any(), any())).thenReturn(new BigDecimal("1000"));
        when(calcHelper.resolveLivingCost(any(), any())).thenReturn(new BigDecimal("500"));
        when(calcHelper.computeEntryCostFree(any(), any(), any())).thenReturn(Map.of("totalEntryCost", new BigDecimal("2300")));
        when(calcHelper.computeRecommendedBudget(any())).thenReturn(new BigDecimal("1725"));
        when(simulationRepository.save(any())).thenAnswer(inv -> {
            BudgetSimulation sim = inv.getArgument(0);
            sim.setId(UUID.randomUUID());
            sim.setCreatedAt(Instant.now());
            return sim;
        });
        when(mapper.toBudgetSimulationResponse(any())).thenReturn(mock(BudgetSimulationResponse.class));

        CreateBudgetSimulationRequest request = freeRequest(city.getId());

        BudgetSimulationResponse result = service.runSimulation(user.getId(), request);
        assertNotNull(result);
        verify(simulationRepository).save(argThat(sim -> "FREE".equals(sim.getPlanCode())));
        verify(analyticsService).trackServerEventSafe(eq(user.getId()), eq("BUDGET_SIMULATION_RUN"), any());
    }

    @Test
    void runSimulation_free_computesEntryCostAndRunway() {
        User user = mockUser();
        RelocationProfile profile = mockProfile();
        RelocationCityDataset city = mockCity();

        when(profileRepository.findByUserId(user.getId())).thenReturn(Optional.of(profile));
        when(cityDatasetRepository.findById(city.getId())).thenReturn(Optional.of(city));
        when(calcHelper.resolveRent(any(), any(), any())).thenReturn(new BigDecimal("1000"));
        when(calcHelper.resolveLivingCost(any(), any())).thenReturn(new BigDecimal("500"));
        when(calcHelper.computeEntryCostFree(any(), any(), any())).thenReturn(Map.of("totalEntryCost", new BigDecimal("2300")));
        when(calcHelper.computeMonthlyBalance(any(), any())).thenReturn(new BigDecimal("1500"));
        when(calcHelper.computeFinancialRunway(any(), any())).thenReturn(Map.of("months", new BigDecimal("5.3"), "level", "MODERATE"));
        when(calcHelper.computeRecommendedBudget(any())).thenReturn(new BigDecimal("1725"));
        when(simulationRepository.save(any())).thenAnswer(inv -> {
            BudgetSimulation sim = inv.getArgument(0);
            sim.setId(UUID.randomUUID());
            sim.setCreatedAt(Instant.now());
            return sim;
        });
        when(mapper.toBudgetSimulationResponse(any())).thenReturn(mock(BudgetSimulationResponse.class));

        CreateBudgetSimulationRequest request = new CreateBudgetSimulationRequest(
                "FREE", city.getId(), new BigDecimal("2500"), new BigDecimal("3000"),
                new BigDecimal("8000"), "single", "single", "1br_center", "center",
                "balanced", null, null, null, null, null, null, null);

        service.runSimulation(user.getId(), request);

        verify(calcHelper).computeEntryCostFree(any(), any(), any());
        verify(calcHelper).computeMonthlyBalance(any(), any());
        verify(calcHelper).computeFinancialRunway(any(), any());
        verify(calcHelper).computeRecommendedBudget(any());
    }

    @Test
    void runSimulation_invalidPlan_throwsBadRequest() {
        CreateBudgetSimulationRequest request = new CreateBudgetSimulationRequest(
                "INVALID", null, null, null, null, null, null, null, null, null,
                null, null, null, null, null, null, null);
        User user = mock(User.class);
        assertThrows(BadRequestException.class, () -> service.runSimulation(user.getId(), request));
    }

    @Test
    void runSimulation_premium_requiresIncome() {
        User user = mockUser();
        RelocationProfile profile = mockProfile();
        RelocationCityDataset city = mockCity();

        when(profileRepository.findByUserId(user.getId())).thenReturn(Optional.of(profile));
        when(cityDatasetRepository.findById(city.getId())).thenReturn(Optional.of(city));

        CreateBudgetSimulationRequest request = new CreateBudgetSimulationRequest(
                "PREMIUM", city.getId(), new BigDecimal("2500"), null, null,
                "single", "single", null, null, null, null, null, null, null, null, null, null);

        assertThrows(BadRequestException.class, () -> service.runSimulation(user.getId(), request));
    }

    @Test
    void runSimulation_premium_computesStabilityScore() {
        User user = mockUser();
        RelocationProfile profile = mockProfile();
        RelocationCityDataset city = mockCity();

        when(profileRepository.findByUserId(user.getId())).thenReturn(Optional.of(profile));
        when(cityDatasetRepository.findById(city.getId())).thenReturn(Optional.of(city));
        when(calcHelper.resolveRent(any(), any(), any())).thenReturn(new BigDecimal("1000"));
        when(calcHelper.resolveLivingCost(any(), any())).thenReturn(new BigDecimal("500"));
        when(calcHelper.computeEntryCostFree(any(), any(), any())).thenReturn(Map.of("totalEntryCost", new BigDecimal("2300")));
        when(calcHelper.computeEntryCostPremium(any(), any(), any(), any())).thenReturn(Map.of("totalEntryCost", new BigDecimal("3500")));
        when(calcHelper.computeMonthlyBalance(any(), any())).thenReturn(new BigDecimal("1500"));
        when(calcHelper.computeRecommendedBudget(any())).thenReturn(new BigDecimal("1725"));
        when(calcHelper.computeStabilityScore(any(), any(), any(), any())).thenReturn(Map.of("score", 75, "level", "STABLE", "penalties", List.of()));
        when(calcHelper.generateInsightSummary(anyInt(), any(), any())).thenReturn("Your situation is stable.");
        when(simulationRepository.save(any())).thenAnswer(inv -> {
            BudgetSimulation sim = inv.getArgument(0);
            sim.setId(UUID.randomUUID());
            sim.setCreatedAt(Instant.now());
            return sim;
        });
        when(mapper.toBudgetSimulationResponse(any())).thenReturn(mock(BudgetSimulationResponse.class));

        CreateBudgetSimulationRequest request = new CreateBudgetSimulationRequest(
                "PREMIUM", city.getId(), new BigDecimal("2500"), new BigDecimal("4000"),
                new BigDecimal("8000"), "single", "single", null, null, null,
                null, null, null, null, null, null, null);

        service.runSimulation(user.getId(), request);

        verify(calcHelper).computeStabilityScore(any(), any(), any(), any());
        verify(calcHelper).generateInsightSummary(anyInt(), any(), any());
        verify(simulationRepository).save(argThat(sim -> "PREMIUM".equals(sim.getPlanCode())));
    }

    @Test
    void runSimulation_superPro_computesExtraCosts() {
        User user = mockUser();
        RelocationProfile profile = mockProfile();
        RelocationCityDataset city = mockCity();

        when(profileRepository.findByUserId(user.getId())).thenReturn(Optional.of(profile));
        when(cityDatasetRepository.findById(city.getId())).thenReturn(Optional.of(city));
        when(calcHelper.resolveRent(any(), any(), any())).thenReturn(new BigDecimal("1000"));
        when(calcHelper.resolveLivingCost(any(), any())).thenReturn(new BigDecimal("500"));
        when(calcHelper.computeEntryCostFree(any(), any(), any())).thenReturn(Map.of("totalEntryCost", new BigDecimal("2300")));
        when(calcHelper.computeEntryCostPremium(any(), any(), any(), any())).thenReturn(Map.of("totalEntryCost", new BigDecimal("3500")));
        when(calcHelper.computeMonthlyBalance(any(), any())).thenReturn(new BigDecimal("1500"));
        when(calcHelper.computeRecommendedBudget(any())).thenReturn(new BigDecimal("1725"));
        when(calcHelper.computeStabilityScore(any(), any(), any(), any())).thenReturn(Map.of("score", 60, "level", "STABLE", "penalties", List.of()));
        when(calcHelper.generateInsightSummary(anyInt(), any(), any())).thenReturn("Insight");
        when(calcHelper.computeEatingOut(any(), any(), anyInt(), any())).thenReturn(new BigDecimal("100"));
        when(calcHelper.computeTransport(any(), any(), anyBoolean())).thenReturn(new BigDecimal("40"));
        when(calcHelper.computeLeisure(any(), any(), anyInt(), any())).thenReturn(new BigDecimal("60"));
        when(calcHelper.computeSchoolsCost(any(), any())).thenReturn(BigDecimal.ZERO);
        when(calcHelper.computeTimeSimulation(any(), any(), any(), any())).thenReturn(List.of());
        when(simulationRepository.save(any())).thenAnswer(inv -> {
            BudgetSimulation sim = inv.getArgument(0);
            sim.setId(UUID.randomUUID());
            sim.setCreatedAt(Instant.now());
            return sim;
        });
        when(mapper.toBudgetSimulationResponse(any())).thenReturn(mock(BudgetSimulationResponse.class));

        CreateBudgetSimulationRequest request = new CreateBudgetSimulationRequest(
                "SUPER_PRO", city.getId(), new BigDecimal("2500"), new BigDecimal("4000"),
                new BigDecimal("10000"), "single", "single", null, null, null,
                0, null, false, "moderate", "public", "regular", 6);

        service.runSimulation(user.getId(), request);

        verify(calcHelper).computeEatingOut(any(), any(), anyInt(), any());
        verify(calcHelper).computeTransport(any(), any(), anyBoolean());
        verify(calcHelper).computeLeisure(any(), any(), anyInt(), any());
        verify(calcHelper).computeTimeSimulation(any(), any(), any(), any());
        verify(simulationRepository).save(argThat(sim -> "SUPER_PRO".equals(sim.getPlanCode())));
    }

    @Test
    void runSimulation_noProfile_throwsNotFound() {
        User user = mockUser();
        when(profileRepository.findByUserId(user.getId())).thenReturn(Optional.empty());

        CreateBudgetSimulationRequest request = freeRequest(null);
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

    // ========== HELPERS ==========

    private CreateBudgetSimulationRequest freeRequest(UUID cityId) {
        return new CreateBudgetSimulationRequest(
                "FREE", cityId, new BigDecimal("2500"), null, null,
                "single", "single", "1br_center", "center", "balanced",
                null, null, null, null, null, null, null);
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
}
