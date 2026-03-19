package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.domain.auth.entity.AdminUser;
import com.syncro.backend.domain.relocation.dto.ScoringConfigResponse;
import com.syncro.backend.domain.relocation.dto.UpdateScoringConfigRequest;
import com.syncro.backend.domain.relocation.RelocationScoringConfigKeys;
import com.syncro.backend.domain.relocation.entity.RelocationScoringConfig;
import com.syncro.backend.domain.relocation.mapper.RelocationMapper;
import com.syncro.backend.domain.relocation.repository.RelocationScoringConfigRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class ScoringConfigService {

    private final RelocationScoringConfigRepository scoringConfigRepository;
    private final RelocationMapper mapper;

    public ScoringConfigService(RelocationScoringConfigRepository scoringConfigRepository,
                                RelocationMapper mapper) {
        this.scoringConfigRepository = scoringConfigRepository;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public ScoringConfigResponse getActiveConfig() {
        RelocationScoringConfig config = scoringConfigRepository.findByConfigKeyAndActiveTrue(RelocationScoringConfigKeys.ACTIVE)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Scoring config not found"));
        return mapper.toScoringConfigResponse(config);
    }

    @Transactional
    public ScoringConfigResponse update(UUID configId, UpdateScoringConfigRequest request, AdminUser admin) {
        RelocationScoringConfig config = scoringConfigRepository.findById(configId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Scoring config not found"));

        if (request.thresholds() != null) config.setThresholds(request.thresholds());
        if (request.budgetMarginThresholds() != null) config.setBudgetMarginThresholds(request.budgetMarginThresholds());
        if (request.budgetPenaltyThresholds() != null) config.setBudgetPenaltyThresholds(request.budgetPenaltyThresholds());
        if (request.lifestyleMultipliers() != null) config.setLifestyleMultipliers(request.lifestyleMultipliers());
        if (request.priorityThresholds() != null) config.setPriorityThresholds(request.priorityThresholds());
        if (request.cityPerformanceThresholds() != null) config.setCityPerformanceThresholds(request.cityPerformanceThresholds());
        config.setUpdatedBy(admin);

        config = scoringConfigRepository.save(config);
        return mapper.toScoringConfigResponse(config);
    }
}
