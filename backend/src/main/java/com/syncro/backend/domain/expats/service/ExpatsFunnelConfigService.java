package com.syncro.backend.domain.expats.service;

import com.syncro.backend.domain.auth.entity.AdminUser;
import com.syncro.backend.domain.expats.dto.CreateFunnelConfigRequest;
import com.syncro.backend.domain.expats.dto.FunnelConfigResponse;
import com.syncro.backend.domain.expats.dto.UpdateFunnelConfigRequest;
import com.syncro.backend.domain.expats.entity.ExpatsFunnelConfig;
import com.syncro.backend.domain.expats.mapper.ExpatsMapper;
import com.syncro.backend.domain.expats.repository.ExpatsFunnelConfigRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class ExpatsFunnelConfigService {

    private final ExpatsFunnelConfigRepository configRepository;
    private final ExpatsMapper mapper;

    public ExpatsFunnelConfigService(ExpatsFunnelConfigRepository configRepository,
                                     ExpatsMapper mapper) {
        this.configRepository = configRepository;
        this.mapper = mapper;
    }

    // ========== PUBLIC ==========

    @Transactional(readOnly = true)
    public FunnelConfigResponse getActiveConfig(String configKey, String language) {
        return configRepository.findByConfigKeyAndLanguageAndActiveTrue(configKey, language)
                .or(() -> configRepository.findByConfigKeyAndLanguageAndActiveTrue(configKey, "en"))
                .map(mapper::toFunnelConfigResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No active funnel config found for key=" + configKey));
    }

    // ========== ADMIN CRUD ==========

    @Transactional(readOnly = true)
    public List<FunnelConfigResponse> listAll() {
        return configRepository.findAll()
                .stream()
                .map(mapper::toFunnelConfigResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public FunnelConfigResponse getById(UUID configId) {
        ExpatsFunnelConfig config = configRepository.findById(configId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Funnel config not found"));
        return mapper.toFunnelConfigResponse(config);
    }

    @Transactional
    public FunnelConfigResponse create(CreateFunnelConfigRequest request, AdminUser admin) {
        String language = request.language() != null ? request.language() : "en";

        // Determine next version for this key+language
        int nextVersion = configRepository.findMaxVersionByConfigKeyAndLanguage(request.configKey(), language) + 1;

        ExpatsFunnelConfig config = new ExpatsFunnelConfig();
        config.setConfigKey(request.configKey());
        config.setLanguage(language);
        config.setVersion(nextVersion);
        config.setContent(request.content());
        config.setFeatureFlags(request.featureFlags());
        config.setActive(request.active() != null ? request.active() : false);
        config.setCreatedBy(admin);
        config.setUpdatedBy(admin);

        // If activating, deactivate other versions for same key+language
        if (Boolean.TRUE.equals(config.getActive())) {
            deactivateOtherVersions(request.configKey(), language);
        }

        config = configRepository.save(config);
        return mapper.toFunnelConfigResponse(config);
    }

    @Transactional
    public FunnelConfigResponse update(UUID configId, UpdateFunnelConfigRequest request, AdminUser admin) {
        ExpatsFunnelConfig config = configRepository.findById(configId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Funnel config not found"));

        if (request.content() != null) config.setContent(request.content());
        if (request.featureFlags() != null) config.setFeatureFlags(request.featureFlags());
        if (request.active() != null) {
            // If activating, deactivate other versions
            if (Boolean.TRUE.equals(request.active()) && !Boolean.TRUE.equals(config.getActive())) {
                deactivateOtherVersions(config.getConfigKey(), config.getLanguage());
            }
            config.setActive(request.active());
        }
        config.setUpdatedBy(admin);

        config = configRepository.save(config);
        return mapper.toFunnelConfigResponse(config);
    }

    private void deactivateOtherVersions(String configKey, String language) {
        configRepository.deactivateByConfigKeyAndLanguage(configKey, language);
    }
}
