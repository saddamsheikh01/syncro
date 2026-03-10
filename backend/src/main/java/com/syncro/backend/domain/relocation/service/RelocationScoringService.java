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
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RelocationScoringService {

    private static final String ALGORITHM_VERSION = "1.0";
    private static final String DEFAULT_CONFIG_KEY = "scoring_v1";

    // Macroarea keys
    private static final String COSTO_VITA = "costo_vita";
    private static final String MERCATO_IMMOBILIARE = "mercato_immobiliare";
    private static final String POTERE_ECONOMICO = "potere_economico";
    private static final String QUALITA_VITA = "qualita_vita";
    private static final String OPPORTUNITA_LAVORATIVE = "opportunita_lavorative";
    private static final String INTEGRAZIONE_SOCIALE = "integrazione_sociale";

    private static final List<String> MACROAREA_KEYS = List.of(
            COSTO_VITA, MERCATO_IMMOBILIARE, POTERE_ECONOMICO,
            QUALITA_VITA, OPPORTUNITA_LAVORATIVE, INTEGRAZIONE_SOCIALE
    );

    private final RelocationProfileRepository profileRepository;
    private final RelocationOnboardingSnapshotRepository snapshotRepository;
    private final RelocationCityDatasetRepository cityRepository;
    private final RelocationCityScoreRepository scoreRepository;
    private final RelocationScoringConfigRepository configRepository;
    private final RelocationWeightRuleRepository weightRuleRepository;
    private final RelocationMapper mapper;
    private final AnalyticsService analyticsService;

    public RelocationScoringService(RelocationProfileRepository profileRepository,
                                    RelocationOnboardingSnapshotRepository snapshotRepository,
                                    RelocationCityDatasetRepository cityRepository,
                                    RelocationCityScoreRepository scoreRepository,
                                    RelocationScoringConfigRepository configRepository,
                                    RelocationWeightRuleRepository weightRuleRepository,
                                    RelocationMapper mapper,
                                    AnalyticsService analyticsService) {
        this.profileRepository = profileRepository;
        this.snapshotRepository = snapshotRepository;
        this.cityRepository = cityRepository;
        this.scoreRepository = scoreRepository;
        this.configRepository = configRepository;
        this.weightRuleRepository = weightRuleRepository;
        this.mapper = mapper;
        this.analyticsService = analyticsService;
    }

    /**
     * Computes City Fit Score for the user based on their active snapshot.
     * For planning_move: scores all active cities and ranks them.
     * For chosen_city: scores only the target city.
     * For already_in_city: computes integration score for the target city.
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
        Map<String, Double> rawWeights = accumulateUserWeights(snapshot.getPayload());
        applyHardFilters(rawWeights, snapshot.getPayload());
        Map<String, Double> normalizedWeights = normalizeWeights(rawWeights);

        // 2. Classify user priorities
        Map<String, String> priorityClassification = classifyPriorities(normalizedWeights, config);

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
                ALGORITHM_VERSION
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

    // ========== CORE SCORING LOGIC ==========

    /**
     * Accumulates user weight vector from snapshot answers using weight rules from DB.
     */
    private Map<String, Double> accumulateUserWeights(Map<String, Object> payload) {
        Map<String, Double> weights = new LinkedHashMap<>();
        for (String key : MACROAREA_KEYS) {
            weights.put(key, 10.0); // Base weight for each macroarea
        }

        List<RelocationWeightRule> allRules = weightRuleRepository.findByActiveTrue();

        // Map of questionKey -> answerValue -> weightAdjustments
        Map<String, Map<String, Map<String, Integer>>> ruleIndex = allRules.stream()
                .collect(Collectors.groupingBy(
                        RelocationWeightRule::getQuestionKey,
                        Collectors.toMap(
                                RelocationWeightRule::getAnswerValue,
                                RelocationWeightRule::getWeightAdjustments,
                                (a, b) -> a
                        )
                ));

        // Map onboarding answers to weight rule question keys
        Map<String, String> answerMapping = mapPayloadToWeightKeys(payload);

        for (Map.Entry<String, String> entry : answerMapping.entrySet()) {
            String questionKey = entry.getKey();
            String answerValue = entry.getValue();

            Map<String, Map<String, Integer>> questionRules = ruleIndex.get(questionKey);
            if (questionRules == null) continue;

            Map<String, Integer> adjustments = questionRules.get(answerValue);
            if (adjustments == null) continue;

            for (Map.Entry<String, Integer> adj : adjustments.entrySet()) {
                weights.merge(adj.getKey(), adj.getValue().doubleValue(), Double::sum);
            }
        }

        // Ensure no negative weights
        weights.replaceAll((k, v) -> Math.max(v, 1.0));

        return weights;
    }

    /**
     * Maps the snapshot payload fields to weight rule question_key + answer_value.
     */
    private Map<String, String> mapPayloadToWeightKeys(Map<String, Object> payload) {
        Map<String, String> mapping = new LinkedHashMap<>();

        putIfString(mapping, "life_state", payload.get("userType"));
        putIfString(mapping, "relocation_time", payload.get("relocationTime"));
        putIfString(mapping, "age_range", payload.get("ageRange"));
        putIfString(mapping, "relationship", payload.get("household"));
        putIfString(mapping, "motivation", payload.get("primaryGoal"));
        putIfString(mapping, "work_type", payload.get("workStatus"));
        putIfString(mapping, "need", payload.get("priorityProblem"));

        return mapping;
    }

    private void putIfString(Map<String, String> map, String key, Object value) {
        if (value instanceof String s && !s.isBlank()) {
            map.put(key, s);
        }
    }

    /**
     * Applies hard filters (budget, remote worker, family) to the weight vector.
     */
    private void applyHardFilters(Map<String, Double> weights, Map<String, Object> payload) {
        // Remote worker: +10 to remote_work_ecosystem (via opportunita_lavorative)
        Object isRemote = payload.get("isRemote");
        if (Boolean.TRUE.equals(isRemote) || "true".equals(isRemote)) {
            weights.merge(OPPORTUNITA_LAVORATIVE, 10.0, Double::sum);
        }

        // Family with children: +10 to qualita_vita
        Object household = payload.get("household");
        if (household instanceof String h && h.contains("children")) {
            weights.merge(QUALITA_VITA, 10.0, Double::sum);
        }
    }

    /**
     * Normalizes weights: weight / sum = normalized quota.
     */
    private Map<String, Double> normalizeWeights(Map<String, Double> rawWeights) {
        double sum = rawWeights.values().stream().mapToDouble(Double::doubleValue).sum();
        if (sum == 0) sum = 1;

        Map<String, Double> normalized = new LinkedHashMap<>();
        double finalSum = sum;
        rawWeights.forEach((k, v) -> normalized.put(k, round(v / finalSum, 4)));
        return normalized;
    }

    /**
     * Classifies user priority levels from normalized weights.
     */
    private Map<String, String> classifyPriorities(Map<String, Double> normalizedWeights,
                                                    RelocationScoringConfig config) {
        Map<String, Object> thresholds = config.getPriorityThresholds();
        double veryHigh = getDoubleThreshold(thresholds, "very_high", 0.25);
        double high = getDoubleThreshold(thresholds, "high", 0.18);
        double medium = getDoubleThreshold(thresholds, "medium", 0.10);
        double low = getDoubleThreshold(thresholds, "low", 0.05);

        Map<String, String> classification = new LinkedHashMap<>();
        for (Map.Entry<String, Double> entry : normalizedWeights.entrySet()) {
            double w = entry.getValue();
            String level;
            if (w > veryHigh) level = "VERY_HIGH";
            else if (w >= high) level = "HIGH";
            else if (w >= medium) level = "MEDIUM";
            else if (w >= low) level = "LOW";
            else level = "VERY_LOW";
            classification.put(entry.getKey(), level);
        }
        return classification;
    }

    /**
     * City Fit Score = SUM(macroarea_city_score * normalized_weight) / sum_weights
     * Then: score - budget_penalty
     */
    private int computeCityFitScore(RelocationCityDataset city, Map<String, Double> normalizedWeights,
                                     RelocationScoringConfig config, Map<String, Object> payload) {
        Map<String, BigDecimal> cityMacroaree = getCityMacroareeMap(city);

        double weightedSum = 0;
        for (String key : MACROAREA_KEYS) {
            BigDecimal cityScore = cityMacroaree.getOrDefault(key, BigDecimal.ZERO);
            double weight = normalizedWeights.getOrDefault(key, 0.0);
            weightedSum += cityScore.doubleValue() * weight;
        }

        // Budget penalty
        int penalty = computeBudgetPenalty(city, config, payload);

        int score = (int) Math.round(weightedSum) - penalty;
        return Math.max(0, Math.min(100, score));
    }

    private Map<String, BigDecimal> getCityMacroareeMap(RelocationCityDataset city) {
        Map<String, BigDecimal> map = new LinkedHashMap<>();
        map.put(COSTO_VITA, city.getMacroCostoVita() != null ? city.getMacroCostoVita() : BigDecimal.ZERO);
        map.put(MERCATO_IMMOBILIARE, city.getMacroMercatoImmobiliare() != null ? city.getMacroMercatoImmobiliare() : BigDecimal.ZERO);
        map.put(POTERE_ECONOMICO, city.getMacroPotereEconomico() != null ? city.getMacroPotereEconomico() : BigDecimal.ZERO);
        map.put(QUALITA_VITA, city.getMacroQualitaVita() != null ? city.getMacroQualitaVita() : BigDecimal.ZERO);
        map.put(OPPORTUNITA_LAVORATIVE, city.getMacroOpportunitaLavorative() != null ? city.getMacroOpportunitaLavorative() : BigDecimal.ZERO);
        map.put(INTEGRAZIONE_SOCIALE, city.getMacroIntegrazioneSociale() != null ? city.getMacroIntegrazioneSociale() : BigDecimal.ZERO);
        return map;
    }

    // ========== BUDGET CHECK ==========

    private Map<String, Object> computeBudgetCheck(RelocationCityDataset city,
                                                    RelocationScoringConfig config,
                                                    Map<String, Object> payload) {
        BigDecimal userBudget = getBudgetFromPayload(payload);
        BigDecimal lifestyleMultiplier = getLifestyleMultiplier(payload, config);
        BigDecimal adjustedBudget = userBudget.multiply(lifestyleMultiplier).setScale(2, RoundingMode.HALF_UP);

        boolean isFamily = isFamily(payload);
        BigDecimal cityCost = isFamily
                ? city.getApartment3brCenter().add(city.getCostFamilyNoRent())
                : city.getApartment1brCenter().add(city.getCostSingleNoRent());

        BigDecimal margin = adjustedBudget.subtract(cityCost);

        String marginStatus = classifyMarginStatus(margin, config);

        Map<String, Object> check = new LinkedHashMap<>();
        check.put("estimatedCityCost", cityCost);
        check.put("userBudgetAdjusted", adjustedBudget);
        check.put("lifestyleMultiplier", lifestyleMultiplier);
        check.put("margin", margin);
        check.put("marginStatus", marginStatus);
        check.put("isFamily", isFamily);

        // Suggestions for unsustainable budgets
        if ("unsustainable".equals(marginStatus) || "very_tight".equals(marginStatus)) {
            List<String> suggestions = new ArrayList<>();
            suggestions.add("Consider shared accommodation to reduce housing costs");
            suggestions.add("Explore peripheral areas with lower rent");
            suggestions.add("Review lifestyle tier - switching to 'essential' can save significantly");
            suggestions.add("Look for additional income opportunities in the city");
            check.put("suggestions", suggestions);
        }

        return check;
    }

    private int computeBudgetPenalty(RelocationCityDataset city, RelocationScoringConfig config,
                                     Map<String, Object> payload) {
        BigDecimal userBudget = getBudgetFromPayload(payload);
        if (userBudget.compareTo(BigDecimal.ZERO) == 0) return 0;

        BigDecimal lifestyleMultiplier = getLifestyleMultiplier(payload, config);
        BigDecimal adjustedBudget = userBudget.multiply(lifestyleMultiplier);

        boolean isFamily = isFamily(payload);
        BigDecimal cityCost = isFamily
                ? city.getApartment3brCenter().add(city.getCostFamilyNoRent())
                : city.getApartment1brCenter().add(city.getCostSingleNoRent());

        BigDecimal margin = adjustedBudget.subtract(cityCost);

        Map<String, Object> penaltyThresholds = config.getBudgetPenaltyThresholds();
        if (margin.compareTo(BigDecimal.ZERO) < 0) {
            return Math.abs(getIntThreshold(penaltyThresholds, "heavy", 20));
        } else if (margin.compareTo(new BigDecimal("100")) < 0) {
            return Math.abs(getIntThreshold(penaltyThresholds, "medium", 10));
        } else if (margin.compareTo(new BigDecimal("400")) < 0) {
            return Math.abs(getIntThreshold(penaltyThresholds, "light", 5));
        }
        return 0;
    }

    private String classifyMarginStatus(BigDecimal margin, RelocationScoringConfig config) {
        Map<String, Object> thresholds = config.getBudgetMarginThresholds();
        double sustainable = getDoubleThreshold(thresholds, "sustainable", 400);
        double tight = getDoubleThreshold(thresholds, "tight", 100);
        double veryTight = getDoubleThreshold(thresholds, "very_tight", 0);

        double m = margin.doubleValue();
        if (m >= sustainable) return "sustainable";
        if (m >= tight) return "tight";
        if (m >= veryTight) return "very_tight";
        return "unsustainable";
    }

    private BigDecimal getLifestyleMultiplier(Map<String, Object> payload, RelocationScoringConfig config) {
        String lifestyle = payload.get("desiredLifestyle") instanceof String s ? s : "balanced";
        Map<String, Object> multipliers = config.getLifestyleMultipliers();
        double value = getDoubleThreshold(multipliers, lifestyle, 1.0);
        return BigDecimal.valueOf(value);
    }

    private BigDecimal getBudgetFromPayload(Map<String, Object> payload) {
        Object budget = payload.get("monthlyBudget");
        if (budget instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        if (budget instanceof String s) {
            try { return new BigDecimal(s); } catch (NumberFormatException e) { return BigDecimal.ZERO; }
        }
        return BigDecimal.ZERO;
    }

    private boolean isFamily(Map<String, Object> payload) {
        Object household = payload.get("household");
        return household instanceof String h && (h.contains("children") || h.contains("family"));
    }

    // ========== COMPATIBILITY LEVEL ==========

    private String classifyCompatibility(int score, RelocationScoringConfig config) {
        Map<String, Object> thresholds = config.getThresholds();
        int veryStrong = getIntThreshold(thresholds, "very_strong_fit", 80);
        int good = getIntThreshold(thresholds, "good_fit", 70);
        int moderate = getIntThreshold(thresholds, "moderate_fit", 60);
        int weak = getIntThreshold(thresholds, "weak_fit", 50);

        if (score >= veryStrong) return "VERY_STRONG_FIT";
        if (score >= good) return "GOOD_FIT";
        if (score >= moderate) return "MODERATE_FIT";
        if (score >= weak) return "WEAK_FIT";
        return "LOW_FIT";
    }

    // ========== INSIGHT GENERATION ==========

    /**
     * Generates 3 rule-based insights: 2 strengths + 1 friction point.
     */
    private Map<String, Object> generateInsights(RelocationCityDataset city,
                                                  Map<String, String> priorityClassification,
                                                  RelocationScoringConfig config) {
        Map<String, BigDecimal> cityMacroaree = getCityMacroareeMap(city);

        double strongThreshold = getDoubleThreshold(config.getCityPerformanceThresholds(), "strong", 75);
        double goodThreshold = getDoubleThreshold(config.getCityPerformanceThresholds(), "good", 60);
        double mediumThreshold = getDoubleThreshold(config.getCityPerformanceThresholds(), "medium", 45);

        // Classify city performance per macroarea
        Map<String, String> cityPerformance = new LinkedHashMap<>();
        for (Map.Entry<String, BigDecimal> entry : cityMacroaree.entrySet()) {
            double score = entry.getValue().doubleValue();
            if (score >= strongThreshold) cityPerformance.put(entry.getKey(), "strong");
            else if (score >= goodThreshold) cityPerformance.put(entry.getKey(), "good");
            else if (score >= mediumThreshold) cityPerformance.put(entry.getKey(), "medium");
            else cityPerformance.put(entry.getKey(), "weak");
        }

        List<Map<String, Object>> strengths = new ArrayList<>();
        List<Map<String, Object>> frictions = new ArrayList<>();

        for (String macroarea : MACROAREA_KEYS) {
            String priority = priorityClassification.getOrDefault(macroarea, "LOW");
            String performance = cityPerformance.getOrDefault(macroarea, "medium");
            boolean highPriority = "VERY_HIGH".equals(priority) || "HIGH".equals(priority);
            boolean lowPriority = "LOW".equals(priority) || "VERY_LOW".equals(priority);
            boolean strongCity = "strong".equals(performance) || "good".equals(performance);
            boolean weakCity = "weak".equals(performance) || "medium".equals(performance);

            Map<String, Object> insight = new LinkedHashMap<>();
            insight.put("macroarea", macroarea);
            insight.put("userPriority", priority);
            insight.put("cityPerformance", performance);
            insight.put("cityScore", cityMacroaree.get(macroarea));

            if (highPriority && strongCity) {
                insight.put("type", "strength");
                insight.put("message", buildStrengthMessage(macroarea, performance, city.getCityName()));
                strengths.add(insight);
            } else if (highPriority && weakCity) {
                insight.put("type", "friction");
                insight.put("message", buildFrictionMessage(macroarea, performance, city.getCityName()));
                frictions.add(insight);
            } else if (lowPriority && strongCity) {
                insight.put("type", "bonus");
                insight.put("message", buildBonusMessage(macroarea, performance, city.getCityName()));
                strengths.add(insight);
            }
        }

        // Sort: best strengths first
        strengths.sort((a, b) -> {
            BigDecimal scoreA = (BigDecimal) a.get("cityScore");
            BigDecimal scoreB = (BigDecimal) b.get("cityScore");
            return scoreB.compareTo(scoreA);
        });

        Map<String, Object> result = new LinkedHashMap<>();
        List<Map<String, Object>> finalInsights = new ArrayList<>();

        // Insight 1: best strength
        if (!strengths.isEmpty()) finalInsights.add(strengths.get(0));
        // Insight 2: second best strength
        if (strengths.size() > 1) finalInsights.add(strengths.get(1));
        // Insight 3: main friction
        if (!frictions.isEmpty()) finalInsights.add(frictions.get(0));

        // If not enough insights, fill from remaining
        if (finalInsights.size() < 3 && strengths.size() > 2) finalInsights.add(strengths.get(2));
        if (finalInsights.size() < 3 && frictions.size() > 1) finalInsights.add(frictions.get(1));

        result.put("insights", finalInsights);
        result.put("cityPerformance", cityPerformance);
        return result;
    }

    private String buildStrengthMessage(String macroarea, String performance, String cityName) {
        return switch (macroarea) {
            case COSTO_VITA -> cityName + " offers " + performance + " cost of living conditions, well aligned with your priorities.";
            case MERCATO_IMMOBILIARE -> "The real estate market in " + cityName + " shows " + performance + " accessibility for your profile.";
            case POTERE_ECONOMICO -> cityName + " has " + performance + " local economic power, supporting your purchasing capacity.";
            case QUALITA_VITA -> "Quality of life in " + cityName + " is " + performance + ", matching your expectations well.";
            case OPPORTUNITA_LAVORATIVE -> cityName + " provides " + performance + " career and work opportunities for your professional profile.";
            case INTEGRAZIONE_SOCIALE -> "Social integration in " + cityName + " is " + performance + ", facilitating your settling process.";
            default -> cityName + " scores " + performance + " on " + macroarea + ".";
        };
    }

    private String buildFrictionMessage(String macroarea, String performance, String cityName) {
        return switch (macroarea) {
            case COSTO_VITA -> "Cost of living in " + cityName + " is " + performance + " and may require budget adjustments.";
            case MERCATO_IMMOBILIARE -> "The real estate market in " + cityName + " is " + performance + " - consider alternative housing options.";
            case POTERE_ECONOMICO -> "Local economic power in " + cityName + " is " + performance + " relative to your expectations.";
            case QUALITA_VITA -> "Quality of life in " + cityName + " rates " + performance + " in areas important to you.";
            case OPPORTUNITA_LAVORATIVE -> "Career opportunities in " + cityName + " are " + performance + " - explore remote and networking options.";
            case INTEGRAZIONE_SOCIALE -> "Social integration in " + cityName + " may be " + performance + " - building connections early is recommended.";
            default -> cityName + " scores " + performance + " on " + macroarea + " which is important to you.";
        };
    }

    private String buildBonusMessage(String macroarea, String performance, String cityName) {
        return switch (macroarea) {
            case COSTO_VITA -> "Bonus: " + cityName + " also has a " + performance + " cost of living, an unexpected advantage.";
            case MERCATO_IMMOBILIARE -> "Bonus: the housing market in " + cityName + " is " + performance + ", a positive extra.";
            case POTERE_ECONOMICO -> "Bonus: local purchasing power in " + cityName + " is " + performance + ".";
            case QUALITA_VITA -> "Bonus: " + cityName + " also offers " + performance + " quality of life.";
            case OPPORTUNITA_LAVORATIVE -> "Bonus: career opportunities in " + cityName + " are " + performance + ".";
            case INTEGRAZIONE_SOCIALE -> "Bonus: social integration in " + cityName + " is " + performance + ".";
            default -> "Bonus: " + cityName + " scores " + performance + " on " + macroarea + ".";
        };
    }

    // ========== INTEGRATION BREAKDOWN (already_in_city) ==========

    private Map<String, Object> computeIntegrationBreakdown(RelocationCityDataset city,
                                                             Map<String, Object> payload) {
        Map<String, Object> breakdown = new LinkedHashMap<>();

        // Housing stability: based on mercato_immobiliare and budget check
        BigDecimal housingScore = city.getMacroMercatoImmobiliare() != null
                ? city.getMacroMercatoImmobiliare() : BigDecimal.ZERO;
        breakdown.put("housing_stability", Map.of(
                "score", housingScore,
                "label", "Housing Stability"
        ));

        // Social integration: based on integrazione_sociale
        BigDecimal socialScore = city.getMacroIntegrazioneSociale() != null
                ? city.getMacroIntegrazioneSociale() : BigDecimal.ZERO;
        breakdown.put("social_integration", Map.of(
                "score", socialScore,
                "label", "Social Integration"
        ));

        // Professional network: based on opportunita_lavorative
        BigDecimal professionalScore = city.getMacroOpportunitaLavorative() != null
                ? city.getMacroOpportunitaLavorative() : BigDecimal.ZERO;
        breakdown.put("professional_network", Map.of(
                "score", professionalScore,
                "label", "Professional Network"
        ));

        // Cost sustainability: based on costo_vita and potere_economico
        BigDecimal costoVita = city.getMacroCostoVita() != null ? city.getMacroCostoVita() : BigDecimal.ZERO;
        BigDecimal potereEco = city.getMacroPotereEconomico() != null ? city.getMacroPotereEconomico() : BigDecimal.ZERO;
        BigDecimal costSustainability = costoVita.add(potereEco)
                .divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP);
        breakdown.put("cost_sustainability", Map.of(
                "score", costSustainability,
                "label", "Cost Sustainability"
        ));

        return breakdown;
    }

    // ========== ANALYSIS TYPE SPECIFIC COMPUTATIONS ==========

    private List<RelocationCityScore> computePlanningMoveScores(
            User user, RelocationOnboardingSnapshot snapshot, RelocationScoringConfig config,
            Map<String, Double> normalizedWeights, Map<String, String> priorityClassification,
            RelocationProfile profile) {

        List<RelocationCityDataset> activeCities = cityRepository.findByActiveTrue();

        List<RelocationCityScore> scores = new ArrayList<>();
        for (RelocationCityDataset city : activeCities) {
            int fitScore = computeCityFitScore(city, normalizedWeights, config, snapshot.getPayload());
            Map<String, Object> budgetCheck = computeBudgetCheck(city, config, snapshot.getPayload());
            Map<String, Object> insights = generateInsights(city, priorityClassification, config);

            RelocationCityScore score = buildCityScore(
                    user, snapshot, city, "planning_move", fitScore,
                    normalizedWeights, priorityClassification, budgetCheck, insights, null);
            scores.add(score);
        }

        // Sort by score descending and assign ranking positions
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

        int fitScore = computeCityFitScore(city, normalizedWeights, config, snapshot.getPayload());
        Map<String, Object> budgetCheck = computeBudgetCheck(city, config, snapshot.getPayload());
        Map<String, Object> insights = generateInsights(city, priorityClassification, config);

        RelocationCityScore score = buildCityScore(
                user, snapshot, city, "chosen_city", fitScore,
                normalizedWeights, priorityClassification, budgetCheck, insights, null);
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

        int fitScore = computeCityFitScore(city, normalizedWeights, config, snapshot.getPayload());
        Map<String, Object> budgetCheck = computeBudgetCheck(city, config, snapshot.getPayload());
        Map<String, Object> insights = generateInsights(city, priorityClassification, config);
        Map<String, Object> integrationBreakdown = computeIntegrationBreakdown(city, snapshot.getPayload());

        RelocationCityScore score = buildCityScore(
                user, snapshot, city, "already_in_city", fitScore,
                normalizedWeights, priorityClassification, budgetCheck, insights, integrationBreakdown);
        score.setRankingPosition(1);

        return List.of(score);
    }

    private RelocationCityScore buildCityScore(User user, RelocationOnboardingSnapshot snapshot,
                                                RelocationCityDataset city, String analysisType, int fitScore,
                                                Map<String, Double> normalizedWeights,
                                                Map<String, String> priorityClassification,
                                                Map<String, Object> budgetCheck,
                                                Map<String, Object> insights,
                                                Map<String, Object> integrationBreakdown) {

        Map<String, BigDecimal> cityMacroaree = getCityMacroareeMap(city);
        String compatibilityLevel = classifyCompatibility(fitScore,
                configRepository.findByConfigKeyAndActiveTrue(DEFAULT_CONFIG_KEY).orElseThrow());

        // Breakdown: the 6 macroaree scores for this city
        Map<String, Object> breakdown = new LinkedHashMap<>();
        cityMacroaree.forEach((k, v) -> breakdown.put(k, v));

        // User weights as JSONB
        Map<String, Object> userWeightsJson = new LinkedHashMap<>(normalizedWeights);

        // Priority classification as JSONB
        Map<String, Object> priorityJson = new LinkedHashMap<>(priorityClassification);

        // Radar values: 1:1 mapping to macroaree
        Map<String, Object> radarValues = new LinkedHashMap<>();
        cityMacroaree.forEach((k, v) -> radarValues.put(k, v));

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
        score.setAlgorithmVersion(ALGORITHM_VERSION);
        score.setComputedAt(Instant.now());

        return score;
    }

    private String resolveAnalysisType(ComputeScoringRequest request, RelocationProfile profile) {
        if (request != null && request.analysisType() != null) {
            return request.analysisType();
        }
        return profile.getUserType() != null ? profile.getUserType() : "planning_move";
    }

    // ========== UTILITY ==========

    private double getDoubleThreshold(Map<String, Object> map, String key, double defaultValue) {
        if (map == null) return defaultValue;
        Object val = map.get(key);
        if (val instanceof Number n) return n.doubleValue();
        if (val instanceof String s) {
            try { return Double.parseDouble(s); } catch (NumberFormatException e) { return defaultValue; }
        }
        return defaultValue;
    }

    private int getIntThreshold(Map<String, Object> map, String key, int defaultValue) {
        if (map == null) return defaultValue;
        Object val = map.get(key);
        if (val instanceof Number n) return n.intValue();
        if (val instanceof String s) {
            try { return Integer.parseInt(s); } catch (NumberFormatException e) { return defaultValue; }
        }
        return defaultValue;
    }

    private double round(double value, int places) {
        return BigDecimal.valueOf(value).setScale(places, RoundingMode.HALF_UP).doubleValue();
    }
}
