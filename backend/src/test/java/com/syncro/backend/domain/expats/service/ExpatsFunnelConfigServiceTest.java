package com.syncro.backend.domain.expats.service;

import com.syncro.backend.domain.auth.entity.AdminUser;
import com.syncro.backend.domain.expats.dto.CreateFunnelConfigRequest;
import com.syncro.backend.domain.expats.dto.FunnelConfigResponse;
import com.syncro.backend.domain.expats.dto.UpdateFunnelConfigRequest;
import com.syncro.backend.domain.expats.entity.ExpatsFunnelConfig;
import com.syncro.backend.domain.expats.mapper.ExpatsMapper;
import com.syncro.backend.domain.expats.repository.ExpatsFunnelConfigRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExpatsFunnelConfigServiceTest {

    @Mock private ExpatsFunnelConfigRepository configRepository;
    @Mock private ExpatsMapper mapper;

    @InjectMocks
    private ExpatsFunnelConfigService service;

    private AdminUser testAdmin;
    private ExpatsFunnelConfig testConfig;

    @BeforeEach
    void setUp() {
        testAdmin = new AdminUser();
        testAdmin.setId(UUID.randomUUID());
        testAdmin.setEmail("admin@test.com");

        testConfig = new ExpatsFunnelConfig();
        testConfig.setId(UUID.randomUUID());
        testConfig.setConfigKey("onboarding_flow");
        testConfig.setLanguage("en");
        testConfig.setVersion(1);
        testConfig.setContent(Map.of("step1", "Welcome"));
        testConfig.setFeatureFlags(Map.of("showTips", true));
        testConfig.setActive(true);
        testConfig.setCreatedBy(testAdmin);
        testConfig.setUpdatedBy(testAdmin);
    }

    @Test
    @DisplayName("getActiveConfig returns config for given key and language")
    void getActiveConfig_returnsConfig() {
        FunnelConfigResponse expected = new FunnelConfigResponse(
                testConfig.getId(), "onboarding_flow", "en", 1,
                Map.of("step1", "Welcome"), Map.of("showTips", true), Instant.now()
        );

        when(configRepository.findByConfigKeyAndLanguageAndActiveTrue("onboarding_flow", "en"))
                .thenReturn(Optional.of(testConfig));
        when(mapper.toFunnelConfigResponse(testConfig)).thenReturn(expected);

        FunnelConfigResponse result = service.getActiveConfig("onboarding_flow", "en");

        assertThat(result).isNotNull();
        assertThat(result.configKey()).isEqualTo("onboarding_flow");
        assertThat(result.language()).isEqualTo("en");
    }

    @Test
    @DisplayName("getActiveConfig throws NOT_FOUND when no active config exists")
    void getActiveConfig_noConfig_throwsNotFound() {
        when(configRepository.findByConfigKeyAndLanguageAndActiveTrue("missing", "en"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getActiveConfig("missing", "en"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("No active funnel config found");
    }

    @Test
    @DisplayName("listAll returns all configs (active and inactive)")
    void listAll_returnsAll() {
        FunnelConfigResponse response = mock(FunnelConfigResponse.class);
        when(configRepository.findAll()).thenReturn(List.of(testConfig));
        when(mapper.toFunnelConfigResponse(testConfig)).thenReturn(response);

        List<FunnelConfigResponse> result = service.listAll();

        assertThat(result).hasSize(1);
        verify(configRepository).findAll();
    }

    @Test
    @DisplayName("getById returns config for UUID")
    void getById_returnsConfig() {
        UUID configId = testConfig.getId();
        FunnelConfigResponse expected = mock(FunnelConfigResponse.class);

        when(configRepository.findById(configId)).thenReturn(Optional.of(testConfig));
        when(mapper.toFunnelConfigResponse(testConfig)).thenReturn(expected);

        FunnelConfigResponse result = service.getById(configId);

        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("create creates new version, auto-increments, deactivates previous when active=true")
    void create_createsNewVersion_deactivatesPrevious() {
        CreateFunnelConfigRequest request = new CreateFunnelConfigRequest(
                "onboarding_flow", "en", Map.of("step1", "New"), null, true
        );

        when(configRepository.findMaxVersionByConfigKeyAndLanguage("onboarding_flow", "en")).thenReturn(1);
        when(configRepository.save(any())).thenAnswer(inv -> {
            ExpatsFunnelConfig c = inv.getArgument(0);
            if (c.getId() == null) c.setId(UUID.randomUUID());
            return c;
        });
        when(mapper.toFunnelConfigResponse(any())).thenReturn(mock(FunnelConfigResponse.class));

        service.create(request, testAdmin);

        // Verify deactivation of other versions was called
        verify(configRepository).deactivateByConfigKeyAndLanguage("onboarding_flow", "en");

        // Verify saved config has version 2
        verify(configRepository).save(argThat(config ->
                config.getVersion() == 2 &&
                Boolean.TRUE.equals(config.getActive()) &&
                config.getCreatedBy().equals(testAdmin)
        ));
    }

    @Test
    @DisplayName("update partially updates config and deactivates previous if activating")
    void update_partialUpdate_deactivatesPreviousIfActivating() {
        testConfig.setActive(false);
        UUID configId = testConfig.getId();

        UpdateFunnelConfigRequest request = new UpdateFunnelConfigRequest(
                Map.of("step1", "Updated"), null, true
        );

        when(configRepository.findById(configId)).thenReturn(Optional.of(testConfig));
        when(configRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(mapper.toFunnelConfigResponse(any())).thenReturn(mock(FunnelConfigResponse.class));

        service.update(configId, request, testAdmin);

        // Verify deactivation since we're activating
        verify(configRepository).deactivateByConfigKeyAndLanguage("onboarding_flow", "en");

        verify(configRepository).save(argThat(config ->
                config.getContent().containsKey("step1") &&
                Boolean.TRUE.equals(config.getActive()) &&
                config.getUpdatedBy().equals(testAdmin)
        ));
    }
}
