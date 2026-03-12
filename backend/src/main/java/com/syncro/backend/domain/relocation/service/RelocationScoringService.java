package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.analytics.service.AnalyticsService;
import com.syncro.backend.domain.relocation.dto.*;
import com.syncro.backend.domain.relocation.entity.*;
import com.syncro.backend.domain.relocation.mapper.RelocationMapper;
import com.syncro.backend.domain.relocation.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Service
public class RelocationScoringService {

    private static final String DEFAULT_CONFIG_KEY = "scoring_v1";

    private final RelocationProfileRepository profileRepository;
    private final RelocationOnboardingSnapshotRepository snapshotRepository;
    private final RelocationCityDatasetRepository cityRepository;
    private final RelocationCityScoreRepository scoreRepository;
    private final RelocationScoringConfigRepository configRepository;
    private final RelocationMapper mapper;
    private final AnalyticsService analyticsService;
    private final ScoringCalculationHelper helper;

    public RelocationScoringService(RelocationProfileRepository profileRepository,
                                    RelocationOnboardingSnapshotRepository snapshotRepository,
                                    RelocationCityDatasetRepository cityRepository,
                                    RelocationCityScoreRepository scoreRepository,
                                    RelocationScoringConfigRepository configRepository,
                                    RelocationWeightRuleRepository weightRuleRepository,
                                    RelocationMapper mapper,
                                    AnalyticsService analyticsService,
                                    ScoringCalculationHelper helper) {
        this.profileRepository = profileRepository;
        this.snapshotRepository = snapshotRepository;
        this.cityRepository = cityRepository;
        this.scoreRepository = scoreRepository;
        this.configRepository = configRepository;
        this.mapper = mapper;
        this.analyticsService = analyticsService;
        this.helper = helper;
    }

    /**
     * Computes City Fit Score for the user based on their active snapshot.
     */
    @Transactional
    public ScoringResultResponse computeScoring(User user, ComputeScoringRequest request) {
        RelocationProfile profile = profileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Relocation profile not found"));

        RelocationOnboardingSnapshot snapshot = snapshotRepository.findByUserIdAndIsActiveTrue(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                        "No active snapshot found. Complete onboarding and create a snapshot first."));

        RelocationScoringConfig config = configRepository.findByConfigKeyAndActiveTrue(DEFAULT_CONFIG_KEY)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Scoring configuration not found"));

        String analysisType = resolveAnalysisType(request, profile);

        // 1. Accumulate user weights from snapshot payload
        Map<String, Double> rawWeights = helper.accumulateUserWeights(snapshot.getPayload());
        helper.applyHardFilters(rawWeights, snapshot.getPayload());
        Map<String, Double> normalizedWeights = helper.normalizeWeights(rawWeights);

        // 2. Classify user priorities
        Map<String, String> priorityClassification = helper.classifyPriorities(normalizedWeights, config);

        // 3. Compute scores per city
        List<RelocationCityScore> scores;

        switch (analysisType) {
            case "planning_move" -> scores = computePlanningMoveScores(
                    user, snapshot, config, normalizedWeights, priorityClassification, profile);
            case "chosen_city" -> scores = computeChosenCityScores(
                    user, snapshot, config, normalizedWeights, priorityClassification, profile, request);
            case "already_in_city" -> scores = computeAlreadyInCityScores(
                    user, snapshot, config, normalizedWeights, priorityClassification, profile);
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid analysis type: " + analysisType);
        }

        scoreRepository.saveAll(scores);

        analyticsService.trackServerEventSafe(user.getId(), "CITY_SCORING_COMPUTED",
                Map.of("analysisType", analysisType,
                        "snapshotVersion", snapshot.getVersion(),
                        "citiesScored", scores.size()));

        List<CityScoreResponse> scoreResponses = scores.stream()
                .map(mapper::toCityScoreResponse)
                .toList();

        return new ScoringResultResponse(
                snapshot.getId(),
                analysisType,
                profile.getUserType(),
                scoreResponses,
                ScoringCalculationHelper.ALGORITHM_VERSION
        );
    }

    @Transactional(readOnly = true)
    public List<CityScoreResponse> getHistory(User user) {
        return scoreRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(mapper::toCityScoreResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CityScoreResponse> getLatestScores(User user, UUID snapshotId) {
        return scoreRepository.findByUserIdAndSnapshotIdOrderByRankingPositionAsc(user.getId(), snapshotId)
                .stream()
                .map(mapper::toCityScoreResponse)
                .toList();
    }

    // ========== ANALYSIS TYPE SPECIFIC COMPUTATIONS ==========

    private List<RelocationCityScore> computePlanningMoveScores(
            User user, RelocationOnboardingSnapshot snapshot, RelocationScoringConfig config,
            Map<String, Double> normalizedWeights, Map<String, String> priorityClassification,
            RelocationProfile profile) {

        List<RelocationCityDataset> activeCities = cityRepository.findByActiveTrue();

        List<RelocationCityScore> scores = new ArrayList<>();
        for (RelocationCityDataset city : activeCities) {
            int fitScore = helper.computeCityFitScore(city, normalizedWeights, config, snapshot.getPayload());
            Map<String, Object> budgetCheck = helper.computeBudgetCheck(city, config, snapshot.getPayload());
            Map<String, Object> insights = helper.generateInsights(city, priorityClassification, config);

            RelocationCityScore score = buildCityScore(
                    user, snapshot, city, "planning_move", fitScore,
                    normalizedWeights, priorityClassification, budgetCheck, insights, null, config);
            scores.add(score);
        }

        scores.sort((a, b) -> b.getScoreTotal().compareTo(a.getScoreTotal()));
        for (int i = 0; i < scores.size(); i++) {
            scores.get(i).setRankingPosition(i + 1);
        }

        return scores;
    }

    private List<RelocationCityScore> computeChosenCityScores(
            User user, RelocationOnboardingSnapshot snapshot, RelocationScoringConfig config,
            Map<String, Double> normalizedWeights, Map<String, String> priorityClassification,
            RelocationProfile profile, ComputeScoringRequest request) {

        UUID targetCityId = request != null && request.targetCityId() != null
                ? request.targetCityId()
                : (profile.getTargetCity() != null ? profile.getTargetCity().getId() : null);

        if (targetCityId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Target city not specified. Set target city in profile or provide targetCityId.");
        }

        RelocationCityDataset city = cityRepository.findById(targetCityId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Target city not found"));

        int fitScore = helper.computeCityFitScore(city, normalizedWeights, config, snapshot.getPayload());
        Map<String, Object> budgetCheck = helper.computeBudgetCheck(city, config, snapshot.getPayload());
        Map<String, Object> insights = helper.generateInsights(city, priorityClassification, config);

        RelocationCityScore score = buildCityScore(
                user, snapshot, city, "chosen_city", fitScore,
                normalizedWeights, priorityClassification, budgetCheck, insights, null, config);
        score.setRankingPosition(1);

        return List.of(score);
    }

    private List<RelocationCityScore> computeAlreadyInCityScores(
            User user, RelocationOnboardingSnapshot snapshot, RelocationScoringConfig config,
            Map<String, Double> normalizedWeights, Map<String, String> priorityClassification,
            RelocationProfile profile) {

        UUID targetCityId = profile.getTargetCity() != null ? profile.getTargetCity().getId() : null;
        if (targetCityId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Target city not set in profile for already_in_city analysis.");
        }

        RelocationCityDataset city = cityRepository.findById(targetCityId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Target city not found"));

        int fitScore = helper.computeCityFitScore(city, normalizedWeights, config, snapshot.getPayload());
        Map<String, Object> budgetCheck = helper.computeBudgetCheck(city, config, snapshot.getPayload());
        Map<String, Object> insights = helper.generateInsights(city, priorityClassification, config);
        Map<String, Object> integrationBreakdown = helper.computeIntegrationBreakdown(city, snapshot.getPayload());

        RelocationCityScore score = buildCityScore(
                user, snapshot, city, "already_in_city", fitScore,
                normalizedWeights, priorityClassification, budgetCheck, insights, integrationBreakdown, config);
        score.setRankingPosition(1);

        return List.of(score);
    }

    private RelocationCityScore buildCityScore(User user, RelocationOnboardingSnapshot snapshot,
                                                RelocationCityDataset city, String analysisType, int fitScore,
                                                Map<String, Double> normalizedWeights,
                                                Map<String, String> priorityClassification,
                                                Map<String, Object> budgetCheck,
                                                Map<String, Object> insights,
                                                Map<String, Object> integrationBreakdown,
                                                RelocationScoringConfig config) {

        Map<String, BigDecimal> cityMacroaree = helper.getCityMacroareeMap(city);
        String compatibilityLevel = helper.classifyCompatibility(fitScore, config);

        Map<String, Object> breakdown = new LinkedHashMap<>(cityMacroaree);
        Map<String, Object> userWeightsJson = new LinkedHashMap<>(normalizedWeights);
        Map<String, Object> priorityJson = new LinkedHashMap<>(priorityClassification);
        Map<String, Object> radarValues = new LinkedHashMap<>(cityMacroaree);

        RelocationCityScore score = new RelocationCityScore();
        score.setUser(user);
        score.setSnapshot(snapshot);
        score.setCity(city);
        score.setAnalysisType(analysisType);
        score.setScoreTotal(fitScore);
        score.setCompatibilityLevel(compatibilityLevel);
        score.setBreakdown(breakdown);
        score.setUserWeights(userWeightsJson);
        score.setUserPriorityClassification(priorityJson);
        score.setRadarValues(radarValues);
        score.setBudgetCheck(budgetCheck);
        score.setInsights(insights);
        score.setIntegrationBreakdown(integrationBreakdown);
        score.setAlgorithmVersion(ScoringCalculationHelper.ALGORITHM_VERSION);
        score.setComputedAt(Instant.now());

        return score;
    }

    private String resolveAnalysisType(ComputeScoringRequest request, RelocationProfile profile) {
        if (request != null && request.analysisType() != null) {
            return request.analysisType();
        }
        return profile.getUserType() != null ? profile.getUserType() : "planning_move";
    }
}
