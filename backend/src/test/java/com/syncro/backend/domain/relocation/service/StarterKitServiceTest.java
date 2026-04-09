package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.relocation.dto.StarterKitResponse;
import com.syncro.backend.domain.relocation.entity.BudgetSimulation;
import com.syncro.backend.domain.relocation.entity.RelocationCityDataset;
import com.syncro.backend.domain.relocation.entity.RelocationProfile;
import com.syncro.backend.domain.relocation.entity.StarterKitReport;
import com.syncro.backend.domain.relocation.mapper.RelocationMapper;
import com.syncro.backend.domain.relocation.repository.*;
import com.syncro.backend.domain.relocation.service.RelocationProfileResolver;
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
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StarterKitServiceTest {

    @Mock private StarterKitReportRepository reportRepository;
    @Mock private RelocationProfileRepository profileRepository;
    @Mock private RelocationCityDatasetRepository cityDatasetRepository;
    @Mock private ScoringCalculationHelper scoringHelper;
    @Mock private RelocationMapper mapper;
    @Mock private AnalyticsService analyticsService;
    @Mock private UserRepository userRepository;
    @Mock private SubscriptionService subscriptionService;
    @Mock private RelocationProfileResolver profileResolver;
    @Mock private BudgetSimulationRepository budgetSimulationRepository;
    @InjectMocks private StarterKitService service;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        lenient().when(subscriptionService.getUserPlan(any())).thenReturn("SUPER_PRO");
        lenient().when(budgetSimulationRepository.findFirstByUser_IdAndCity_IdOrderByCreatedAtDesc(any(), any()))
                .thenReturn(Optional.empty());
    }

    @Test
    void generate_returnsAllSections() {
        User user = mockUser();
        RelocationProfile profile = mockProfile("planning_move");

        when(profileResolver.findOrRecover(user.getId())).thenReturn(profile);
        when(scoringHelper.computeCityCost(any(), anyBoolean())).thenReturn(new BigDecimal("1500"));
        when(scoringHelper.getCityMacroareeMap(any())).thenReturn(Map.of(
                "opportunita_lavorative", new BigDecimal("80"),
                "integrazione_sociale", new BigDecimal("70"),
                "qualita_vita", new BigDecimal("75"),
                "potere_economico", new BigDecimal("65"),
                "costo_vita", new BigDecimal("55"),
                "mercato_immobiliare", new BigDecimal("50")
        ));
        when(reportRepository.save(any())).thenAnswer(inv -> {
            StarterKitReport report = inv.getArgument(0);
            report.setId(UUID.randomUUID());
            report.setCreatedAt(Instant.now());
            return report;
        });
        when(mapper.toStarterKitResponse(any())).thenReturn(mock(StarterKitResponse.class));

        StarterKitResponse result = service.generate(user.getId(), null);
        assertNotNull(result);
        verify(reportRepository).save(argThat(report -> {
            Map<String, Object> payload = report.getPayload();
            return payload.containsKey("cityAlignmentSnapshot") &&
                    payload.containsKey("cityFitCards") &&
                    payload.containsKey("budgetAnalysis") &&
                    payload.containsKey("quickActions") &&
                    payload.containsKey("commonRelocationMistake") &&
                    payload.containsKey("scamSentinel") &&
                    payload.containsKey("initialStressLevel") &&
                    payload.containsKey("relocationRisk") &&
                    payload.containsKey("sevenDayActionPlan") &&
                    payload.containsKey("safetyBuffer");
        }));
    }

    @Test
    void generate_noProfile_throwsNotFound() {
        User user = mockUser();
        when(profileResolver.findOrRecover(user.getId()))
                .thenThrow(new NotFoundException("Relocation profile not found"));
        assertThrows(NotFoundException.class, () -> service.generate(user.getId(), null));
    }

    @Test
    void getLatest_noReport_throwsNotFound() {
        User user = mockUser();
        when(reportRepository.findFirstByUser_IdOrderByCreatedAtDesc(user.getId())).thenReturn(Optional.empty());
        assertThrows(NotFoundException.class, () -> service.getLatest(user.getId()));
    }

    @Test
    @SuppressWarnings("unchecked")
    void generate_stressLevel_computedFromProfile() {
        User user = mockUser();
        RelocationProfile profile = mockProfile("planning_move");
        lenient().when(profile.getPrimaryGoal()).thenReturn("family_stability");
        lenient().when(profile.getHousehold()).thenReturn("with_children");
        lenient().when(profile.getPriorityProblem()).thenReturn("housing");

        when(profileResolver.findOrRecover(user.getId())).thenReturn(profile);
        when(scoringHelper.computeCityCost(any(), anyBoolean())).thenReturn(new BigDecimal("1500"));
        when(scoringHelper.getCityMacroareeMap(any())).thenReturn(Map.of(
                "opportunita_lavorative", new BigDecimal("70"),
                "integrazione_sociale", new BigDecimal("60"),
                "qualita_vita", new BigDecimal("65"),
                "potere_economico", new BigDecimal("55"),
                "costo_vita", new BigDecimal("50"),
                "mercato_immobiliare", new BigDecimal("45")
        ));
        when(reportRepository.save(any())).thenAnswer(inv -> {
            StarterKitReport report = inv.getArgument(0);
            report.setId(UUID.randomUUID());
            report.setCreatedAt(Instant.now());
            return report;
        });
        when(mapper.toStarterKitResponse(any())).thenReturn(mock(StarterKitResponse.class));

        service.generate(user.getId(), null);

        verify(reportRepository).save(argThat(report -> {
            Map<String, Object> stress = (Map<String, Object>) report.getPayload().get("initialStressLevel");
            int score = (int) stress.get("score");
            // planning_move=2 + with_children=2 + family_stability=2 + housing=2 = 8 → HIGH
            return score == 8 && "HIGH".equals(stress.get("level"));
        }));
    }

    @Test
    @SuppressWarnings("unchecked")
    void generate_budgetAnalysisUsesMatchingCitySimulationBudget() {
        User user = mockUser();
        RelocationProfile profile = mockProfile("planning_move");
        RelocationCityDataset city = profile.getTargetCity();
        BudgetSimulation matchingSimulation = mock(BudgetSimulation.class);

        when(profileResolver.findOrRecover(user.getId())).thenReturn(profile);
        when(scoringHelper.computeCityCost(any(), anyBoolean())).thenReturn(new BigDecimal("1500"));
        when(scoringHelper.getCityMacroareeMap(any())).thenReturn(Map.of(
                "opportunita_lavorative", new BigDecimal("70"),
                "integrazione_sociale", new BigDecimal("60"),
                "qualita_vita", new BigDecimal("65"),
                "potere_economico", new BigDecimal("55"),
                "costo_vita", new BigDecimal("50"),
                "mercato_immobiliare", new BigDecimal("45")
        ));
        when(budgetSimulationRepository.findFirstByUser_IdAndCity_IdOrderByCreatedAtDesc(user.getId(), city.getId()))
                .thenReturn(Optional.of(matchingSimulation));
        when(matchingSimulation.getOutputPayload()).thenReturn(new LinkedHashMap<>(Map.of(
                "estimatedMonthlyCost", 2850,
                "rent", 1500,
                "livingCost", 1350,
                "livingType", "family"
        )));
        when(matchingSimulation.getInputPayload()).thenReturn(new LinkedHashMap<>(Map.of(
                "monthlyBudget", 3650
        )));
        when(reportRepository.save(any())).thenAnswer(inv -> {
            StarterKitReport report = inv.getArgument(0);
            report.setId(UUID.randomUUID());
            report.setCreatedAt(Instant.now());
            return report;
        });
        when(mapper.toStarterKitResponse(any())).thenReturn(mock(StarterKitResponse.class));

        service.generate(user.getId(), null);

        verify(reportRepository).save(argThat(report -> {
            Map<String, Object> budget = (Map<String, Object>) report.getPayload().get("budgetAnalysis");
            BigDecimal userBudget = BigDecimal.valueOf(((Number) budget.get("userBudget")).doubleValue());
            BigDecimal margin = BigDecimal.valueOf(((Number) budget.get("margin")).doubleValue());
            return userBudget.compareTo(new BigDecimal("3650")) == 0
                    && margin.compareTo(new BigDecimal("800")) == 0
                    && "matching_simulation".equals(budget.get("source"));
        }));
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
        lenient().when(profile.getPrimaryGoal()).thenReturn("career_growth");
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
        lenient().when(city.getApartment3brCenter()).thenReturn(new BigDecimal("1600"));
        lenient().when(city.getCostSingleNoRent()).thenReturn(new BigDecimal("600"));
        lenient().when(city.getCostFamilyNoRent()).thenReturn(new BigDecimal("1200"));
        return city;
    }
}
