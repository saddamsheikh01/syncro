package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.relocation.dto.StarterKitResponse;
import com.syncro.backend.domain.relocation.entity.RelocationCityDataset;
import com.syncro.backend.domain.relocation.entity.RelocationProfile;
import com.syncro.backend.domain.relocation.entity.RelocationScoringConfig;
import com.syncro.backend.domain.relocation.entity.StarterKitReport;
import com.syncro.backend.domain.relocation.mapper.RelocationMapper;
import com.syncro.backend.domain.relocation.repository.*;
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
class StarterKitServiceTest {

    @Mock private StarterKitReportRepository reportRepository;
    @Mock private RelocationProfileRepository profileRepository;
    @Mock private RelocationCityDatasetRepository cityDatasetRepository;
    @Mock private RelocationScoringConfigRepository scoringConfigRepository;
    @Mock private RelocationRiskSnapshotRepository riskSnapshotRepository;
    @Mock private ScoringCalculationHelper scoringHelper;
    @Mock private RelocationMapper mapper;
    @Mock private AnalyticsService analyticsService;
    @InjectMocks private StarterKitService service;

    @Test
    void generate_planningMove_returns7Sections() {
        User user = mockUser();
        RelocationProfile profile = mockProfile("planning_move");
        RelocationScoringConfig config = mockConfig();

        when(profileRepository.findByUserId(user.getId())).thenReturn(Optional.of(profile));
        when(scoringConfigRepository.findByConfigKeyAndActiveTrue("city_scoring_v1"))
                .thenReturn(Optional.of(config));
        when(scoringHelper.computeCityCost(any(), anyBoolean())).thenReturn(new BigDecimal("1500"));
        when(scoringHelper.classifyMarginStatus(any(), any())).thenReturn("sustainable");
        when(reportRepository.save(any())).thenAnswer(inv -> {
            StarterKitReport report = inv.getArgument(0);
            report.setId(UUID.randomUUID());
            report.setCreatedAt(Instant.now());
            return report;
        });
        when(mapper.toStarterKitResponse(any())).thenReturn(mock(StarterKitResponse.class));

        StarterKitResponse result = service.generate(user, null);
        assertNotNull(result);
        verify(reportRepository).save(argThat(report -> {
            Map<String, Object> payload = report.getPayload();
            return payload.containsKey("cityAnalysis") &&
                    payload.containsKey("budgetAnalysis") &&
                    payload.containsKey("quickActions") &&
                    payload.containsKey("typicalMistake") &&
                    payload.containsKey("scamSentinel") &&
                    payload.containsKey("burnoutRisk") &&
                    payload.containsKey("riskSnapshot");
        }));
    }

    @Test
    void generate_noProfile_throwsNotFound() {
        User user = mockUser();
        when(profileRepository.findByUserId(user.getId())).thenReturn(Optional.empty());
        assertThrows(NotFoundException.class, () -> service.generate(user, null));
    }

    @Test
    void getLatest_noReport_throwsNotFound() {
        User user = mockUser();
        when(reportRepository.findFirstByUser_IdOrderByCreatedAtDesc(user.getId())).thenReturn(Optional.empty());
        assertThrows(NotFoundException.class, () -> service.getLatest(user));
    }

    @Test
    void generate_alreadyInCity_differentActions() {
        User user = mockUser();
        RelocationProfile profile = mockProfile("already_in_city");
        RelocationScoringConfig config = mockConfig();

        when(profileRepository.findByUserId(user.getId())).thenReturn(Optional.of(profile));
        when(scoringConfigRepository.findByConfigKeyAndActiveTrue("city_scoring_v1"))
                .thenReturn(Optional.of(config));
        when(scoringHelper.computeCityCost(any(), anyBoolean())).thenReturn(new BigDecimal("1500"));
        when(scoringHelper.classifyMarginStatus(any(), any())).thenReturn("tight");
        when(reportRepository.save(any())).thenAnswer(inv -> {
            StarterKitReport report = inv.getArgument(0);
            report.setId(UUID.randomUUID());
            report.setCreatedAt(Instant.now());
            return report;
        });
        when(mapper.toStarterKitResponse(any())).thenReturn(mock(StarterKitResponse.class));

        service.generate(user, null);
        verify(reportRepository).save(argThat(report ->
                "already_in_city".equals(report.getScenario())));
    }

    private User mockUser() {
        User user = mock(User.class);
        when(user.getId()).thenReturn(UUID.randomUUID());
        return user;
    }

    private RelocationProfile mockProfile(String scenario) {
        RelocationProfile profile = mock(RelocationProfile.class);
        lenient().when(profile.getUserType()).thenReturn(scenario);
        lenient().when(profile.getMonthlyBudget()).thenReturn(new BigDecimal("2500"));
        lenient().when(profile.getHousehold()).thenReturn("single");
        lenient().when(profile.getPriorityProblem()).thenReturn("bureaucracy");
        RelocationCityDataset city = mockCity();
        lenient().when(profile.getTargetCity()).thenReturn(city);
        return profile;
    }

    private RelocationCityDataset mockCity() {
        RelocationCityDataset city = mock(RelocationCityDataset.class);
        lenient().when(city.getId()).thenReturn(UUID.randomUUID());
        lenient().when(city.getCityName()).thenReturn("Berlin");
        lenient().when(city.getCountry()).thenReturn("Germany");
        lenient().when(city.getApartment1brCenter()).thenReturn(new BigDecimal("900"));
        lenient().when(city.getCostSingleNoRent()).thenReturn(new BigDecimal("600"));
        lenient().when(city.getMacroCostoVita()).thenReturn(new BigDecimal("65"));
        lenient().when(city.getMacroMercatoImmobiliare()).thenReturn(new BigDecimal("45"));
        lenient().when(city.getMacroPotereEconomico()).thenReturn(new BigDecimal("70"));
        lenient().when(city.getMacroQualitaVita()).thenReturn(new BigDecimal("75"));
        lenient().when(city.getMacroOpportunitaLavorative()).thenReturn(new BigDecimal("80"));
        lenient().when(city.getMacroIntegrazioneSociale()).thenReturn(new BigDecimal("60"));
        lenient().when(city.getSafetyIndex()).thenReturn(new BigDecimal("72"));
        lenient().when(city.getHealthcareIndex()).thenReturn(new BigDecimal("78"));
        return city;
    }

    private RelocationScoringConfig mockConfig() {
        RelocationScoringConfig config = mock(RelocationScoringConfig.class);
        lenient().when(config.getBudgetMarginThresholds()).thenReturn(Map.of("sustainable", 400, "tight", 100, "very_tight", 0));
        return config;
    }
}
