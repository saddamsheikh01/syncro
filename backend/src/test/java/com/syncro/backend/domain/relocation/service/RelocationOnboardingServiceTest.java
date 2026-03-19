package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.domain.analytics.service.AnalyticsService;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.relocation.dto.ActivationStateResponse;
import com.syncro.backend.domain.relocation.dto.OnboardingResponse;
import com.syncro.backend.domain.relocation.dto.OnboardingStatusResponse;
import com.syncro.backend.domain.relocation.dto.SnapshotResponse;
import com.syncro.backend.domain.relocation.dto.UpdateOnboardingRequest;
import com.syncro.backend.domain.relocation.entity.RelocationCityScore;
import com.syncro.backend.domain.relocation.entity.RelocationOnboardingSnapshot;
import com.syncro.backend.domain.relocation.entity.RelocationProfile;
import com.syncro.backend.domain.relocation.mapper.RelocationMapper;
import com.syncro.backend.domain.relocation.repository.RelocationCityDatasetRepository;
import com.syncro.backend.domain.relocation.repository.RelocationCityScoreRepository;
import com.syncro.backend.domain.relocation.repository.RelocationOnboardingSnapshotRepository;
import com.syncro.backend.domain.relocation.repository.RelocationProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RelocationOnboardingServiceTest {

    @Mock private RelocationProfileRepository profileRepository;
    @Mock private RelocationOnboardingSnapshotRepository snapshotRepository;
    @Mock private RelocationCityDatasetRepository cityDatasetRepository;
    @Mock private RelocationCityScoreRepository cityScoreRepository;
    @Mock private UserRepository userRepository;
    @Mock private RelocationMapper mapper;
    @Mock private AnalyticsService analyticsService;

    @InjectMocks
    private RelocationOnboardingService service;

    private User testUser;
    private RelocationProfile testProfile;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());

        testProfile = new RelocationProfile();
        testProfile.setId(UUID.randomUUID());
        testProfile.setUser(testUser);
        testProfile.setUserType("planning_move");
        testProfile.setHousehold("single");
        testProfile.setMonthlyBudget(BigDecimal.valueOf(2000));
        testProfile.setPrimaryGoal("career");
        testProfile.setSocialPriority("medium");
        testProfile.setDesiredLifestyle("balanced");
        testProfile.setWorkStatus("employed");
        testProfile.setPriorityProblem("monthly_costs");
        testProfile.setCompletedSteps(5);
        testProfile.setCompletionPercent(50);
        testProfile.setStatus("IN_PROGRESS");
        testProfile.setCreatedAt(Instant.now());
        testProfile.setUpdatedAt(Instant.now());
    }

    @Test
    @DisplayName("getOnboarding returns profile for authenticated user")
    void getOnboarding_returnsProfile() {
        OnboardingResponse expected = new OnboardingResponse(
                testProfile.getId(), "planning_move", null, null, null,
                null, null,
                "single", false, null, BigDecimal.valueOf(2000),
                "career", "medium", "balanced", "employed", false,
                "monthly_costs", null, 5, 50, "IN_PROGRESS",
                testProfile.getCreatedAt(), testProfile.getUpdatedAt()
        );

        when(profileRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(testProfile));
        when(mapper.toOnboardingResponse(testProfile)).thenReturn(expected);

        OnboardingResponse result = service.getOnboarding(testUser.getId());

        assertThat(result).isNotNull();
        assertThat(result.userType()).isEqualTo("planning_move");
        assertThat(result.completedSteps()).isEqualTo(5);
    }

    @Test
    @DisplayName("getOnboarding throws NOT_FOUND when no profile exists")
    void getOnboarding_noProfile_throwsNotFound() {
        when(profileRepository.findByUserId(testUser.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getOnboarding(testUser.getId()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Relocation profile not found");
    }

    @Test
    @DisplayName("updateOnboarding creates new profile if none exists")
    void updateOnboarding_createsNewProfile() {
        when(profileRepository.findByUserId(testUser.getId())).thenReturn(Optional.empty());
        when(userRepository.getReferenceById(testUser.getId())).thenReturn(testUser);
        when(profileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(mapper.toOnboardingResponse(any())).thenReturn(mock(OnboardingResponse.class));

        UpdateOnboardingRequest request = new UpdateOnboardingRequest(
                "chosen_city", "Lisbon", "Portugal", null, null, null, null, null,
                null, null, null, null, null, null, null, null, 1
        );

        service.updateOnboarding(testUser.getId(), request);

        verify(profileRepository).save(argThat(profile ->
                profile.getUserType().equals("chosen_city") &&
                profile.getTargetCityName().equals("Lisbon")
        ));
    }

    @Test
    @DisplayName("updateOnboarding sets COMPLETED status at 10 steps")
    void updateOnboarding_setsCompletedAt10Steps() {
        testProfile.setCompletedSteps(9);
        testProfile.setCompletionPercent(90);

        when(profileRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(testProfile));
        when(profileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(mapper.toOnboardingResponse(any())).thenReturn(mock(OnboardingResponse.class));

        UpdateOnboardingRequest request = new UpdateOnboardingRequest(
                null, null, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null, 10
        );

        service.updateOnboarding(testUser.getId(), request);

        verify(profileRepository).save(argThat(profile ->
                "COMPLETED".equals(profile.getStatus()) &&
                profile.getCompletionPercent() == 100
        ));

        verify(analyticsService).trackServerEventSafe(eq(testUser.getId()), eq("RELOCATION_ONBOARDING_COMPLETED"), anyMap());
    }

    @Test
    @DisplayName("createSnapshot throws CONFLICT if onboarding not completed")
    void createSnapshot_notCompleted_throwsConflict() {
        testProfile.setStatus("IN_PROGRESS");
        when(profileRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(testProfile));

        assertThatThrownBy(() -> service.createSnapshot(testUser.getId()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Onboarding must be completed");
    }

    @Test
    @DisplayName("createSnapshot deactivates previous snapshot and creates new one")
    void createSnapshot_deactivatesPrevious() {
        testProfile.setStatus("COMPLETED");

        RelocationOnboardingSnapshot oldSnapshot = new RelocationOnboardingSnapshot();
        oldSnapshot.setId(UUID.randomUUID());
        oldSnapshot.setIsActive(true);
        oldSnapshot.setVersion(1);

        when(profileRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(testProfile));
        when(snapshotRepository.findByUserIdAndIsActiveTrue(testUser.getId())).thenReturn(Optional.of(oldSnapshot));
        when(snapshotRepository.findMaxVersionByUserId(testUser.getId())).thenReturn(1);
        when(snapshotRepository.save(any())).thenAnswer(inv -> {
            RelocationOnboardingSnapshot s = inv.getArgument(0);
            if (s.getId() == null) s.setId(UUID.randomUUID());
            return s;
        });
        when(mapper.toSnapshotResponse(any())).thenReturn(
                new SnapshotResponse(UUID.randomUUID(), 2, true, Map.of(), Instant.now())
        );

        when(userRepository.getReferenceById(testUser.getId())).thenReturn(testUser);

        SnapshotResponse result = service.createSnapshot(testUser.getId());

        assertThat(result).isNotNull();
        assertThat(result.version()).isEqualTo(2);

        // Verify old snapshot was deactivated
        verify(snapshotRepository).save(argThat(s -> s.getId().equals(oldSnapshot.getId()) && !s.getIsActive()));
    }

    @Test
    @DisplayName("getOnboardingStatus returns correct status data")
    void getOnboardingStatus_returnsCorrectData() {
        when(profileRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(testProfile));
        when(snapshotRepository.findByUserIdAndIsActiveTrue(testUser.getId())).thenReturn(Optional.empty());
        when(snapshotRepository.findMaxVersionByUserId(testUser.getId())).thenReturn(0);
        when(mapper.toOnboardingStatusResponse(eq(testProfile), eq(false), isNull()))
                .thenReturn(new OnboardingStatusResponse("IN_PROGRESS", 5, 50, "planning_move", false, null, Instant.now()));

        OnboardingStatusResponse result = service.getOnboardingStatus(testUser.getId());

        assertThat(result).isNotNull();
        assertThat(result.status()).isEqualTo("IN_PROGRESS");
        assertThat(result.hasActiveSnapshot()).isFalse();
    }

    // ========== U7: Missing method tests ==========

    @Test
    @DisplayName("getActivationState returns completed/missing fields and next actions")
    void getActivationState_returnsFieldsAndActions() {
        // Profile with some fields null
        testProfile.setTargetCityName(null);
        testProfile.setFreeNotes(null);
        testProfile.setStatus("IN_PROGRESS");

        when(profileRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(testProfile));
        when(snapshotRepository.findByUserIdAndIsActiveTrue(testUser.getId())).thenReturn(Optional.empty());
        when(cityScoreRepository.findByUserIdOrderByCreatedAtDesc(testUser.getId())).thenReturn(List.of());

        ActivationStateResponse result = service.getActivationState(testUser.getId());

        assertThat(result).isNotNull();
        assertThat(result.status()).isEqualTo("IN_PROGRESS");
        assertThat(result.completedFields()).contains("user_phase", "household", "monthly_budget");
        assertThat(result.missingFields()).contains("target_city", "free_notes");
        assertThat(result.hasActiveSnapshot()).isFalse();
        assertThat(result.hasScoringResults()).isFalse();
        assertThat(result.nextActions()).anyMatch(a -> "complete_onboarding".equals(a.get("action")));
    }

    @Test
    @DisplayName("getActivationState next action = compute_scoring when has snapshot but no score")
    void getActivationState_computeScoringAction() {
        testProfile.setStatus("COMPLETED");
        testProfile.setCompletedSteps(10);
        testProfile.setCompletionPercent(100);
        testProfile.setFreeNotes("some notes");
        testProfile.setTargetCityName("Lisbon");

        RelocationOnboardingSnapshot activeSnapshot = new RelocationOnboardingSnapshot();
        activeSnapshot.setId(UUID.randomUUID());
        activeSnapshot.setIsActive(true);

        when(profileRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(testProfile));
        when(snapshotRepository.findByUserIdAndIsActiveTrue(testUser.getId())).thenReturn(Optional.of(activeSnapshot));
        when(cityScoreRepository.findByUserIdOrderByCreatedAtDesc(testUser.getId())).thenReturn(List.of());

        ActivationStateResponse result = service.getActivationState(testUser.getId());

        assertThat(result.hasActiveSnapshot()).isTrue();
        assertThat(result.hasScoringResults()).isFalse();
        assertThat(result.nextActions()).anyMatch(a -> "compute_scoring".equals(a.get("action")));
    }

    @Test
    @DisplayName("initFromConversion maps anonymous answers to relocation profile")
    void initFromConversion_mapsAnswers() {
        when(profileRepository.existsByUserId(testUser.getId())).thenReturn(false);
        when(profileRepository.save(any())).thenAnswer(inv -> {
            RelocationProfile p = inv.getArgument(0);
            if (p.getId() == null) p.setId(UUID.randomUUID());
            return p;
        });

        Map<String, Object> answers = Map.of(
                "user_phase", "chosen_city",
                "city_choice", "Lisbon",
                "country_choice", "Portugal",
                "household", "couple",
                "monthly_budget", 2500,
                "primary_goal", "career",
                "social_priority", "high",
                "desired_lifestyle", "premium",
                "work_status", "remote",
                "priority_problem", "monthly_costs"
        );

        when(userRepository.getReferenceById(testUser.getId())).thenReturn(testUser);

        RelocationProfile result = service.initFromConversion(testUser.getId(), UUID.randomUUID(), answers);

        assertThat(result).isNotNull();
        verify(profileRepository).save(argThat(profile ->
                "chosen_city".equals(profile.getUserType()) &&
                "Lisbon".equals(profile.getTargetCityName()) &&
                "couple".equals(profile.getHousehold())
        ));
    }

    @Test
    @DisplayName("getSnapshots returns list ordered by version desc")
    void getSnapshots_returnsOrderedList() {
        RelocationOnboardingSnapshot s1 = new RelocationOnboardingSnapshot();
        s1.setId(UUID.randomUUID());
        s1.setVersion(2);
        RelocationOnboardingSnapshot s2 = new RelocationOnboardingSnapshot();
        s2.setId(UUID.randomUUID());
        s2.setVersion(1);

        when(snapshotRepository.findByUserIdOrderByVersionDesc(testUser.getId()))
                .thenReturn(List.of(s1, s2));
        when(mapper.toSnapshotResponse(any())).thenReturn(
                new SnapshotResponse(UUID.randomUUID(), 1, false, Map.of(), Instant.now())
        );

        List<SnapshotResponse> result = service.getSnapshots(testUser.getId());

        assertThat(result).hasSize(2);
        verify(snapshotRepository).findByUserIdOrderByVersionDesc(testUser.getId());
    }
}
