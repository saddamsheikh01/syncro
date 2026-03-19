package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.analytics.service.AnalyticsService;
import com.syncro.backend.domain.expats.entity.ExpatsAnonymousSession;
import com.syncro.backend.domain.expats.repository.ExpatsAnonymousSessionRepository;
import com.syncro.backend.domain.relocation.RelocationScoringConfigKeys;
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


    private final RelocationProfileRepository profileRepository;
    private final RelocationOnboardingSnapshotRepository snapshotRepository;
    private final RelocationCityDatasetRepository cityRepository;
    private final RelocationCityScoreRepository scoreRepository;
    private final RelocationScoringConfigRepository configRepository;
    private final UserRepository userRepository;
    private final RelocationMapper mapper;
    private final AnalyticsService analyticsService;
    private final ScoringCalculationHelper helper;
    private final AnonymousRelocationService anonymousRelocationService;
    private final ExpatsAnonymousSessionRepository expatsSessionRepository;

    public RelocationScoringService(RelocationProfileRepository profileRepository,
                                    RelocationOnboardingSnapshotRepository snapshotRepository,
                                    RelocationCityDatasetRepository cityRepository,
                                    RelocationCityScoreRepository scoreRepository,
                                    RelocationScoringConfigRepository configRepository,
                                    RelocationWeightRuleRepository weightRuleRepository,
                                    UserRepository userRepository,
                                    RelocationMapper mapper,
                                    AnalyticsService analyticsService,
                                    ScoringCalculationHelper helper,
                                    AnonymousRelocationService anonymousRelocationService,
                                    ExpatsAnonymousSessionRepository expatsSessionRepository) {
        this.profileRepository = profileRepository;
        this.snapshotRepository = snapshotRepository;
        this.cityRepository = cityRepository;
        this.scoreRepository = scoreRepository;
        this.configRepository = configRepository;
        this.userRepository = userRepository;
        this.mapper = mapper;
        this.analyticsService = analyticsService;
        this.helper = helper;
        this.anonymousRelocationService = anonymousRelocationService;
        this.expatsSessionRepository = expatsSessionRepository;
    }

    /**
     * Computes City Fit Score for the user based on their active snapshot.
     */
    @Transactional
    public ScoringResultResponse computeScoring(UUID userId, ComputeScoringRequest request) {
        RelocationProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Relocation profile not found"));

        RelocationOnboardingSnapshot snapshot = snapshotRepository.findByUserIdAndIsActiveTrue(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                        "No active snapshot found. Complete onboarding and create a snapshot first."));

        RelocationScoringConfig config = configRepository.findByConfigKeyAndActiveTrue(RelocationScoringConfigKeys.ACTIVE)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Scoring configuration not found"));

        String analysisType = canonicalAnalysisType(request, profile);

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
                    userId, null, snapshot, config, normalizedWeights, priorityClassification, profile);
            case "chosen_city" -> scores = computeChosenCityScores(
                    userId, null, snapshot, config, normalizedWeights, priorityClassification, profile, request);
            case "already_in_city" -> scores = computeAlreadyInCityScores(
                    userId, null, snapshot, config, normalizedWeights, priorityClassification, profile);
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid analysis type: " + analysisType);
        }

        scoreRepository.saveAll(scores);

        analyticsService.trackServerEventSafe(userId, "CITY_SCORING_COMPUTED",
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

    /**
     * WOW / anonymous funnel: scores tied to expat session (no registered user).
     */
    @Transactional
    public ScoringResultResponse computeScoringAnonymous(UUID sessionId, ComputeScoringRequest request) {
        RelocationOnboardingSnapshot snapshot = anonymousRelocationService.refreshActiveSnapshot(sessionId);
        RelocationProfile profile = profileRepository.findByAnonymousSession_Id(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Anonymous relocation profile not found"));
        ExpatsAnonymousSession anon = expatsSessionRepository.getReferenceById(sessionId);

        RelocationScoringConfig config = configRepository.findByConfigKeyAndActiveTrue(RelocationScoringConfigKeys.ACTIVE)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Scoring configuration not found"));

        String analysisType = canonicalAnalysisType(request, profile);
        Map<String, Double> rawWeights = helper.accumulateUserWeights(snapshot.getPayload());
        helper.applyHardFilters(rawWeights, snapshot.getPayload());
        Map<String, Double> normalizedWeights = helper.normalizeWeights(rawWeights);
        Map<String, String> priorityClassification = helper.classifyPriorities(normalizedWeights, config);

        List<RelocationCityScore> scores;
        switch (analysisType) {
            case "planning_move" -> scores = computePlanningMoveScores(
                    null, anon, snapshot, config, normalizedWeights, priorityClassification, profile);
            case "chosen_city" -> scores = computeChosenCityScores(
                    null, anon, snapshot, config, normalizedWeights, priorityClassification, profile, request);
            case "already_in_city" -> scores = computeAlreadyInCityScores(
                    null, anon, snapshot, config, normalizedWeights, priorityClassification, profile);
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid analysis type: " + analysisType);
        }

        scoreRepository.saveAll(scores);
        analyticsService.trackServerEventSafe(null, "CITY_SCORING_COMPUTED_ANON",
                Map.of("sessionId", sessionId.toString(),
                        "analysisType", analysisType,
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
    public List<CityScoreResponse> getHistory(UUID userId) {
        return scoreRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(mapper::toCityScoreResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CityScoreResponse> getLatestScores(UUID userId, UUID snapshotId) {
        return scoreRepository.findByUserIdAndSnapshotIdOrderByRankingPositionAsc(userId, snapshotId)
                .stream()
                .map(mapper::toCityScoreResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CityScoreResponse> getLatestScoresAnonymous(UUID sessionId, UUID snapshotId) {
        return scoreRepository.findByAnonymousSession_IdAndSnapshot_IdOrderByRankingPositionAsc(sessionId, snapshotId)
                .stream()
                .map(mapper::toCityScoreResponse)
                .toList();
    }

    // ========== ANALYSIS TYPE SPECIFIC COMPUTATIONS ==========

    private List<RelocationCityScore> computePlanningMoveScores(
            UUID userId,
            ExpatsAnonymousSession anonymousSession,
            RelocationOnboardingSnapshot snapshot, RelocationScoringConfig config,
            Map<String, Double> normalizedWeights, Map<String, String> priorityClassification,
            RelocationProfile profile) {

        List<RelocationCityDataset> activeCities = cityRepository.findByActiveTrue();

        List<RelocationCityScore> scores = new ArrayList<>();
        for (RelocationCityDataset city : activeCities) {
            int fitScore = helper.computeCityFitScore(city, normalizedWeights, config, snapshot.getPayload());
            Map<String, Object> budgetCheck = helper.computeBudgetCheck(city, config, snapshot.getPayload());
            Map<String, Object> insights = helper.generateInsights(city, priorityClassification, config);

            RelocationCityScore score = buildCityScore(
                    userId, anonymousSession, snapshot, city, "planning_move", fitScore,
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
            UUID userId,
            ExpatsAnonymousSession anonymousSession,
            RelocationOnboardingSnapshot snapshot, RelocationScoringConfig config,
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
                userId, anonymousSession, snapshot, city, "chosen_city", fitScore,
                normalizedWeights, priorityClassification, budgetCheck, insights, null, config);
        score.setRankingPosition(1);

        return List.of(score);
    }

    private List<RelocationCityScore> computeAlreadyInCityScores(
            UUID userId,
            ExpatsAnonymousSession anonymousSession,
            RelocationOnboardingSnapshot snapshot, RelocationScoringConfig config,
            Map<String, Double> normalizedWeights, Map<String, String> priorityClassification,
            RelocationProfile profile) {

        UUID targetCityId = profile.getCurrentCity() != null ? profile.getCurrentCity().getId()
                : (profile.getTargetCity() != null ? profile.getTargetCity().getId() : null);
        if (targetCityId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Current/target city not set in profile for already_in_city analysis.");
        }

        RelocationCityDataset city = cityRepository.findById(targetCityId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Target city not found"));

        int fitScore = helper.computeCityFitScore(city, normalizedWeights, config, snapshot.getPayload());
        Map<String, Object> budgetCheck = helper.computeBudgetCheck(city, config, snapshot.getPayload());
        Map<String, Object> insights = helper.generateInsights(city, priorityClassification, config);
        Map<String, Object> integrationBreakdown = helper.computeIntegrationBreakdown(city, snapshot.getPayload());

        RelocationCityScore score = buildCityScore(
                userId, anonymousSession, snapshot, city, "already_in_city", fitScore,
                normalizedWeights, priorityClassification, budgetCheck, insights, integrationBreakdown, config);
        score.setRankingPosition(1);

        return List.of(score);
    }

    private RelocationCityScore buildCityScore(UUID userId,
                                                ExpatsAnonymousSession anonymousSession,
                                                RelocationOnboardingSnapshot snapshot,
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
        if (userId != null) {
            score.setUser(userRepository.getReferenceById(userId));
        } else if (anonymousSession != null) {
            score.setAnonymousSession(anonymousSession);
        } else {
            throw new IllegalStateException("Score must have user or anonymous session");
        }
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

    /**
     * Maps frontend analysis types (CITY_RANKING, CHOSEN_CITY_ANALYSIS) and profile userType to internal keys.
     */
    private String canonicalAnalysisType(ComputeScoringRequest request, RelocationProfile profile) {
        if (request != null && request.targetCityId() != null) {
            return "chosen_city";
        }
        if (request != null && request.analysisType() != null) {
            String at = request.analysisType();
            if (at.contains("CHOSEN") || "chosen_city".equalsIgnoreCase(at)) {
                return "chosen_city";
            }
            if (at.contains("RANKING") || "CITY_RANKING".equalsIgnoreCase(at)) {
                return "planning_move";
            }
            if (at.contains("INTEGRATION") || "already_in_city".equalsIgnoreCase(at)) {
                return "already_in_city";
            }
            if ("planning_move".equals(at) || "chosen_city".equals(at) || "already_in_city".equals(at)) {
                return at;
            }
        }
        String ut = profile.getUserType();
        if (ut == null) {
            return "planning_move";
        }
        return switch (ut) {
            case "chosen_city" -> "chosen_city";
            case "already_in_city" -> "already_in_city";
            default -> "planning_move";
        };
    }
}
