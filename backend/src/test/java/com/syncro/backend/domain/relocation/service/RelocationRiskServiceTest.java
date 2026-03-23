package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.relocation.dto.RiskSnapshotResponse;
import com.syncro.backend.domain.relocation.entity.RelocationCityDataset;
import com.syncro.backend.domain.relocation.entity.RelocationProfile;
import com.syncro.backend.domain.relocation.entity.RelocationRiskSnapshot;
import com.syncro.backend.domain.relocation.entity.RelocationScoringConfig;
import com.syncro.backend.domain.relocation.mapper.RelocationMapper;
import com.syncro.backend.domain.relocation.repository.RelocationProfileRepository;
import com.syncro.backend.domain.relocation.repository.RelocationRiskSnapshotRepository;
import com.syncro.backend.domain.relocation.repository.RelocationScoringConfigRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RelocationRiskServiceTest {

    @Mock private RelocationRiskSnapshotRepository riskSnapshotRepository;
    @Mock private RelocationProfileRepository profileRepository;
    @Mock private RelocationScoringConfigRepository scoringConfigRepository;
    @Mock private ScoringCalculationHelper scoringHelper;
    @Mock private RelocationMapper mapper;
    @InjectMocks private RelocationRiskService service;

    @Test
    void getLatestIndicators_existingSnapshot_returnsIt() {
        User user = mockUser();
        RelocationRiskSnapshot snapshot = mock(RelocationRiskSnapshot.class);
        RiskSnapshotResponse resp = mock(RiskSnapshotResponse.class);

        when(riskSnapshotRepository.findFirstByUser_IdOrderByCreatedAtDesc(user.getId()))
                .thenReturn(Optional.of(snapshot));
        when(mapper.toRiskSnapshotResponse(snapshot)).thenReturn(resp);

        RiskSnapshotResponse result = service.getLatestIndicators(user);
        assertNotNull(result);
        verify(riskSnapshotRepository, never()).save(any());
    }

    @Test
    void computeAndSaveSnapshot_noProfile_throwsNotFound() {
        User user = mockUser();
        when(profileRepository.findByUserId(user.getId())).thenReturn(Optional.empty());
        assertThrows(NotFoundException.class, () -> service.computeAndSaveSnapshot(user));
    }

    @Test
    void computeAndSaveSnapshot_highRisk_returnsCorrectLevel() {
        User user = mockUser();
        RelocationProfile profile = mockProfile();
        RelocationScoringConfig config = mockConfig();

        when(profileRepository.findByUserId(user.getId())).thenReturn(Optional.of(profile));
        when(scoringConfigRepository.findByConfigKeyAndActiveTrue("city_scoring_v1")).thenReturn(Optional.of(config));
        when(scoringHelper.computeCityCost(any(), anyBoolean())).thenReturn(new BigDecimal("3000"));
        when(scoringHelper.classifyMarginStatus(any(), any())).thenReturn("unsustainable");
        when(riskSnapshotRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        RiskSnapshotResponse mockResp = mock(RiskSnapshotResponse.class);
        when(mapper.toRiskSnapshotResponse(any())).thenReturn(mockResp);

        RiskSnapshotResponse result = service.computeAndSaveSnapshot(user);
        assertNotNull(result);
        verify(riskSnapshotRepository).save(argThat(snap ->
                snap.getRiskIndicators().containsKey("financialRisk")));
    }

    private User mockUser() {
        User user = mock(User.class);
        when(user.getId()).thenReturn(UUID.randomUUID());
        return user;
    }

    private RelocationProfile mockProfile() {
        RelocationProfile profile = mock(RelocationProfile.class);
        lenient().when(profile.getUserType()).thenReturn("planning_move");
        lenient().when(profile.getMonthlyBudget()).thenReturn(new BigDecimal("1500"));
        lenient().when(profile.getHousehold()).thenReturn("alone");
        lenient().when(profile.getPriorityProblem()).thenReturn("loneliness");
        RelocationCityDataset city = mock(RelocationCityDataset.class);
        lenient().when(profile.getTargetCity()).thenReturn(city);
        return profile;
    }

    private RelocationScoringConfig mockConfig() {
        RelocationScoringConfig config = mock(RelocationScoringConfig.class);
        lenient().when(config.getBudgetMarginThresholds()).thenReturn(Map.of("sustainable", 400, "tight", 100, "very_tight", 0));
        return config;
    }
}
