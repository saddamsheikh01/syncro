package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.domain.auth.entity.AdminUser;
import com.syncro.backend.domain.relocation.dto.ScoringConfigResponse;
import com.syncro.backend.domain.relocation.dto.UpdateScoringConfigRequest;
import com.syncro.backend.domain.relocation.entity.RelocationScoringConfig;
import com.syncro.backend.domain.relocation.mapper.RelocationMapper;
import com.syncro.backend.domain.relocation.repository.RelocationScoringConfigRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScoringConfigServiceTest {

    @Mock private RelocationScoringConfigRepository scoringConfigRepository;
    @Mock private RelocationMapper mapper;

    @InjectMocks
    private ScoringConfigService service;

    private AdminUser testAdmin;
    private RelocationScoringConfig testConfig;

    @BeforeEach
    void setUp() {
        testAdmin = new AdminUser();
        testAdmin.setId(UUID.randomUUID());

        testConfig = new RelocationScoringConfig();
        testConfig.setId(UUID.randomUUID());
        testConfig.setConfigKey("city_scoring_v1");
        testConfig.setActive(true);
        testConfig.setThresholds(Map.of("very_strong_fit", 80, "good_fit", 70));
        testConfig.setBudgetMarginThresholds(Map.of("sustainable", 400));
        testConfig.setBudgetPenaltyThresholds(Map.of("heavy", -20));
        testConfig.setLifestyleMultipliers(Map.of("balanced", 1.0));
        testConfig.setPriorityThresholds(Map.of("high", 0.18));
        testConfig.setCityPerformanceThresholds(Map.of("strong", 75));
    }

    @Test
    @DisplayName("getActiveConfig returns active scoring config")
    void getActiveConfig_returnsConfig() {
        ScoringConfigResponse expected = new ScoringConfigResponse(
                testConfig.getId(), "city_scoring_v1",
                testConfig.getThresholds(), testConfig.getBudgetMarginThresholds(),
                testConfig.getBudgetPenaltyThresholds(), testConfig.getLifestyleMultipliers(),
                testConfig.getPriorityThresholds(), testConfig.getCityPerformanceThresholds(),
                true, Instant.now(), Instant.now()
        );

        when(scoringConfigRepository.findByConfigKeyAndActiveTrue("city_scoring_v1"))
                .thenReturn(Optional.of(testConfig));
        when(mapper.toScoringConfigResponse(testConfig)).thenReturn(expected);

        ScoringConfigResponse result = service.getActiveConfig();

        assertThat(result).isNotNull();
        assertThat(result.configKey()).isEqualTo("city_scoring_v1");
        assertThat(result.active()).isTrue();
    }

    @Test
    @DisplayName("getActiveConfig throws NOT_FOUND when no active config exists")
    void getActiveConfig_noConfig_throwsNotFound() {
        when(scoringConfigRepository.findByConfigKeyAndActiveTrue("city_scoring_v1"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getActiveConfig())
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Scoring config not found");
    }

    @Test
    @DisplayName("update partially updates only provided fields")
    void update_partialUpdate() {
        UUID configId = testConfig.getId();

        UpdateScoringConfigRequest request = new UpdateScoringConfigRequest(
                Map.of("very_strong_fit", 85), // update thresholds
                null, null, null, null, null  // leave others unchanged
        );

        when(scoringConfigRepository.findById(configId)).thenReturn(Optional.of(testConfig));
        when(scoringConfigRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(mapper.toScoringConfigResponse(any())).thenReturn(mock(ScoringConfigResponse.class));

        service.update(configId, request, testAdmin);

        verify(scoringConfigRepository).save(argThat(config ->
                config.getThresholds().get("very_strong_fit").equals(85) &&
                config.getBudgetMarginThresholds().get("sustainable").equals(400) && // unchanged
                config.getUpdatedBy().equals(testAdmin)
        ));
    }

    @Test
    @DisplayName("update throws NOT_FOUND when config doesn't exist")
    void update_notFound() {
        UUID configId = UUID.randomUUID();
        when(scoringConfigRepository.findById(configId)).thenReturn(Optional.empty());

        UpdateScoringConfigRequest request = new UpdateScoringConfigRequest(
                Map.of("very_strong_fit", 85), null, null, null, null, null
        );

        assertThatThrownBy(() -> service.update(configId, request, testAdmin))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Scoring config not found");
    }
}
