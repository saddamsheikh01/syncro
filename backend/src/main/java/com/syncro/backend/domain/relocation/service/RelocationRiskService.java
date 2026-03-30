package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.relocation.dto.RiskSnapshotResponse;
import com.syncro.backend.domain.relocation.entity.RelocationProfile;
import com.syncro.backend.domain.relocation.entity.RelocationRiskSnapshot;
import com.syncro.backend.domain.relocation.entity.RelocationScoringConfig;
import com.syncro.backend.domain.relocation.mapper.RelocationMapper;
import com.syncro.backend.domain.relocation.repository.RelocationProfileRepository;
import com.syncro.backend.domain.relocation.repository.RelocationRiskSnapshotRepository;
import com.syncro.backend.domain.relocation.repository.RelocationScoringConfigRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
public class RelocationRiskService {

    private final RelocationRiskSnapshotRepository riskSnapshotRepository;
    private final RelocationProfileRepository profileRepository;
    private final RelocationScoringConfigRepository scoringConfigRepository;
    private final ScoringCalculationHelper scoringHelper;
    private final RelocationMapper mapper;
    private final UserRepository userRepository;
    private final RelocationProfileResolver profileResolver;

    public RelocationRiskService(RelocationRiskSnapshotRepository riskSnapshotRepository,
                                  RelocationProfileRepository profileRepository,
                                  RelocationScoringConfigRepository scoringConfigRepository,
                                  ScoringCalculationHelper scoringHelper,
                                  RelocationMapper mapper,
                                  UserRepository userRepository,
                                  RelocationProfileResolver profileResolver) {
        this.riskSnapshotRepository = riskSnapshotRepository;
        this.profileRepository = profileRepository;
        this.scoringConfigRepository = scoringConfigRepository;
        this.scoringHelper = scoringHelper;
        this.mapper = mapper;
        this.userRepository = userRepository;
        this.profileResolver = profileResolver;
    }

    @Transactional(readOnly = true)
    public RiskSnapshotResponse getLatestIndicators(UUID userId) {
        return riskSnapshotRepository.findFirstByUser_IdOrderByCreatedAtDesc(userId)
                .map(mapper::toRiskSnapshotResponse)
                .orElseGet(() -> computeAndSaveSnapshot(userId));
    }

    @Transactional
    public RiskSnapshotResponse computeAndSaveSnapshot(UUID userId) {
        User user = userRepository.getReferenceById(userId);
        RelocationProfile profile = profileResolver.findOrRecover(userId);
        RelocationScoringConfig config = scoringConfigRepository.findByConfigKeyAndActiveTrue("city_scoring_v1")
                .orElseThrow(() -> new NotFoundException("Configurazione scoring non trovata"));

        Map<String, Object> indicators = new LinkedHashMap<>();
        String scenario = profile.getUserType();

        BigDecimal budget = profile.getMonthlyBudget();
        boolean isFamily = profile.getHousehold() != null &&
                (profile.getHousehold().contains("children") || profile.getHousehold().contains("family"));

        String financialRisk = "LOW";
        if (profile.getTargetCity() != null) {
            BigDecimal cityCost = scoringHelper.computeCityCost(profile.getTargetCity(), isFamily);
            BigDecimal margin = budget.subtract(cityCost);
            String marginStatus = scoringHelper.classifyMarginStatus(margin, config);
            financialRisk = switch (marginStatus) {
                case "unsustainable" -> "CRITICAL";
                case "very_tight" -> "HIGH";
                case "tight" -> "MODERATE";
                default -> "LOW";
            };
        }
        indicators.put("financialRisk", financialRisk);

        String isolationRisk = "LOW";
        if ("alone".equals(profile.getHousehold()) || "single".equals(profile.getHousehold())) {
            isolationRisk = "MODERATE";
        }
        String priority = profile.getPriorityProblem();
        if ("loneliness".equals(priority) || "social_isolation".equals(priority)) {
            isolationRisk = "HIGH";
        }
        indicators.put("isolationRisk", isolationRisk);

        String adaptationRisk = "planning_move".equals(scenario) ? "MODERATE" : "LOW";
        indicators.put("adaptationRisk", adaptationRisk);

        int burnoutIndex = computeBurnoutIndex(financialRisk, isolationRisk, adaptationRisk);
        String overallLevel = classifyOverallRisk(indicators);

        RelocationRiskSnapshot snapshot = new RelocationRiskSnapshot();
        snapshot.setUser(user);
        snapshot.setScenario(scenario);
        snapshot.setSourceType("CONSOLIDATED");
        snapshot.setRiskIndicators(indicators);
        snapshot.setBurnoutIndex(burnoutIndex);
        snapshot.setOverallRiskLevel(overallLevel);

        snapshot = riskSnapshotRepository.save(snapshot);
        return mapper.toRiskSnapshotResponse(snapshot);
    }

    private int computeBurnoutIndex(String financialRisk, String isolationRisk, String adaptationRisk) {
        int index = 0;
        index += riskToScore(financialRisk);
        index += riskToScore(isolationRisk);
        index += riskToScore(adaptationRisk);
        return Math.min(100, index);
    }

    private int riskToScore(String risk) {
        return switch (risk) {
            case "CRITICAL" -> 35;
            case "HIGH" -> 25;
            case "MODERATE" -> 15;
            default -> 5;
        };
    }

    private String classifyOverallRisk(Map<String, Object> indicators) {
        long highCount = indicators.values().stream()
                .filter(v -> "HIGH".equals(v) || "CRITICAL".equals(v))
                .count();
        if (highCount >= 2) return "HIGH";
        if (highCount == 1) return "MODERATE";
        return "LOW";
    }
}
