package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.relocation.dto.StarterKitResponse;
import com.syncro.backend.domain.relocation.entity.RelocationCityDataset;
import com.syncro.backend.domain.relocation.entity.RelocationProfile;
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
    @InjectMocks private StarterKitService service;

    @Test
    void generate_returnsAllSections() {
        User user = mockUser();
        RelocationProfile profile = mockProfile("planning_move");

        when(profileRepository.findByUserId(user.getId())).thenReturn(Optional.of(profile));
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
        when(profileRepository.findByUserId(user.getId())).thenReturn(Optional.empty());
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

        when(profileRepository.findByUserId(user.getId())).thenReturn(Optional.of(profile));
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
