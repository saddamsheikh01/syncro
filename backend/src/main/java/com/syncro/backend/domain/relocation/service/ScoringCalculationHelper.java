package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.domain.relocation.entity.RelocationCityDataset;
import com.syncro.backend.domain.relocation.entity.RelocationScoringConfig;
import com.syncro.backend.domain.relocation.entity.RelocationWeightRule;
import com.syncro.backend.domain.relocation.repository.RelocationWeightRuleRepository;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Helper condiviso per il calcolo scoring.
 * Contiene la logica di accumulo pesi, normalizzazione, classificazione priorita,
 * City Fit Score, budget check e insight generation.
 * Usato sia da RelocationScoringService che da CityComparisonService.
 */
@Component
public class ScoringCalculationHelper {

    static final String ALGORITHM_VERSION = "1.0";

    // Macroarea keys
    static final String COSTO_VITA = "costo_vita";
    static final String MERCATO_IMMOBILIARE = "mercato_immobiliare";
    static final String POTERE_ECONOMICO = "potere_economico";
    static final String QUALITA_VITA = "qualita_vita";
    static final String OPPORTUNITA_LAVORATIVE = "opportunita_lavorative";
    static final String INTEGRAZIONE_SOCIALE = "integrazione_sociale";

    static final List<String> MACROAREA_KEYS = List.of(
            COSTO_VITA, MERCATO_IMMOBILIARE, POTERE_ECONOMICO,
            QUALITA_VITA, OPPORTUNITA_LAVORATIVE, INTEGRAZIONE_SOCIALE
    );

    private final RelocationWeightRuleRepository weightRuleRepository;

    public ScoringCalculationHelper(RelocationWeightRuleRepository weightRuleRepository) {
        this.weightRuleRepository = weightRuleRepository;
    }

    // ========== WEIGHT ACCUMULATION ==========

    public Map<String, Double> accumulateUserWeights(Map<String, Object> payload) {
        Map<String, Double> weights = new LinkedHashMap<>();
        for (String key : MACROAREA_KEYS) {
            weights.put(key, 10.0);
        }

        List<RelocationWeightRule> allRules = weightRuleRepository.findByActiveTrue();

        Map<String, Map<String, Map<String, Integer>>> ruleIndex = allRules.stream()
                .collect(Collectors.groupingBy(
                        RelocationWeightRule::getQuestionKey,
                        Collectors.toMap(
                                RelocationWeightRule::getAnswerValue,
                                RelocationWeightRule::getWeightAdjustments,
                                (a, b) -> a
                        )
                ));

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

        weights.replaceAll((k, v) -> Math.max(v, 1.0));
        return weights;
    }

    public Map<String, String> mapPayloadToWeightKeys(Map<String, Object> payload) {
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

    // ========== HARD FILTERS ==========

    public void applyHardFilters(Map<String, Double> weights, Map<String, Object> payload) {
        Object isRemote = payload.get("isRemote");
        if (Boolean.TRUE.equals(isRemote) || "true".equals(isRemote)) {
            weights.merge(OPPORTUNITA_LAVORATIVE, 10.0, Double::sum);
        }

        Object household = payload.get("household");
        if (household instanceof String h && h.contains("children")) {
            weights.merge(QUALITA_VITA, 10.0, Double::sum);
        }
    }

    // ========== NORMALIZATION ==========

    public Map<String, Double> normalizeWeights(Map<String, Double> rawWeights) {
        double sum = rawWeights.values().stream().mapToDouble(Double::doubleValue).sum();
        if (sum == 0) sum = 1;

        Map<String, Double> normalized = new LinkedHashMap<>();
        double finalSum = sum;
        rawWeights.forEach((k, v) -> normalized.put(k, round(v / finalSum, 4)));
        return normalized;
    }

    // ========== PRIORITY CLASSIFICATION ==========

    public Map<String, String> classifyPriorities(Map<String, Double> normalizedWeights,
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

    // ========== CITY FIT SCORE ==========

    public int computeCityFitScore(RelocationCityDataset city, Map<String, Double> normalizedWeights,
                                     RelocationScoringConfig config, Map<String, Object> payload) {
        Map<String, BigDecimal> cityMacroaree = getCityMacroareeMap(city);

        double weightedSum = 0;
        for (String key : MACROAREA_KEYS) {
            BigDecimal cityScore = cityMacroaree.getOrDefault(key, BigDecimal.ZERO);
            double weight = normalizedWeights.getOrDefault(key, 0.0);
            weightedSum += cityScore.doubleValue() * weight;
        }

        int penalty = computeBudgetPenalty(city, config, payload);
        int score = (int) Math.round(weightedSum) - penalty;
        return Math.max(0, Math.min(100, score));
    }

    public Map<String, BigDecimal> getCityMacroareeMap(RelocationCityDataset city) {
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

    public Map<String, Object> computeBudgetCheck(RelocationCityDataset city,
                                                    RelocationScoringConfig config,
                                                    Map<String, Object> payload) {
        BigDecimal userBudget = getBudgetFromPayload(payload);
        BigDecimal lifestyleMultiplier = getLifestyleMultiplier(payload, config);

        boolean isFamily = isFamily(payload);
        BigDecimal baseCityCost = computeCityCost(city, isFamily);
        BigDecimal adjustedCityCost = baseCityCost.multiply(lifestyleMultiplier).setScale(2, RoundingMode.HALF_UP);

        BigDecimal margin = userBudget.subtract(adjustedCityCost);
        String marginStatus = classifyMarginStatus(margin, config);

        Map<String, Object> check = new LinkedHashMap<>();
        check.put("declaredBudget", userBudget);
        check.put("estimatedCityCost", adjustedCityCost);
        check.put("baseCityCost", baseCityCost);
        check.put("lifestyleMultiplier", lifestyleMultiplier);
        check.put("margin", margin);
        check.put("marginStatus", marginStatus);
        check.put("isFamily", isFamily);

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

    public BigDecimal computeCityCost(RelocationCityDataset city, boolean isFamily) {
        return isFamily
                ? city.getApartment3brCenter().add(city.getCostFamilyNoRent())
                : city.getApartment1brCenter().add(city.getCostSingleNoRent());
    }

    public int computeBudgetPenalty(RelocationCityDataset city, RelocationScoringConfig config,
                                     Map<String, Object> payload) {
        BigDecimal userBudget = getBudgetFromPayload(payload);
        if (userBudget.compareTo(BigDecimal.ZERO) == 0) return 0;

        BigDecimal lifestyleMultiplier = getLifestyleMultiplier(payload, config);

        boolean isFamily = isFamily(payload);
        BigDecimal baseCityCost = computeCityCost(city, isFamily);
        BigDecimal adjustedCityCost = baseCityCost.multiply(lifestyleMultiplier);

        BigDecimal margin = userBudget.subtract(adjustedCityCost);

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

    public String classifyMarginStatus(BigDecimal margin, RelocationScoringConfig config) {
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

    // ========== COMPATIBILITY LEVEL ==========

    public String classifyCompatibility(int score, RelocationScoringConfig config) {
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

    public Map<String, Object> generateInsights(RelocationCityDataset city,
                                                  Map<String, String> priorityClassification,
                                                  RelocationScoringConfig config) {
        Map<String, BigDecimal> cityMacroaree = getCityMacroareeMap(city);

        double strongThreshold = getDoubleThreshold(config.getCityPerformanceThresholds(), "strong", 75);
        double goodThreshold = getDoubleThreshold(config.getCityPerformanceThresholds(), "good", 60);
        double mediumThreshold = getDoubleThreshold(config.getCityPerformanceThresholds(), "medium", 45);

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

        strengths.sort((a, b) -> {
            BigDecimal scoreA = (BigDecimal) a.get("cityScore");
            BigDecimal scoreB = (BigDecimal) b.get("cityScore");
            return scoreB.compareTo(scoreA);
        });

        Map<String, Object> result = new LinkedHashMap<>();
        List<Map<String, Object>> finalInsights = new ArrayList<>();

        if (!strengths.isEmpty()) finalInsights.add(strengths.get(0));
        if (strengths.size() > 1) finalInsights.add(strengths.get(1));
        if (!frictions.isEmpty()) finalInsights.add(frictions.get(0));
        if (finalInsights.size() < 3 && strengths.size() > 2) finalInsights.add(strengths.get(2));
        if (finalInsights.size() < 3 && frictions.size() > 1) finalInsights.add(frictions.get(1));

        result.put("insights", finalInsights);
        result.put("cityPerformance", cityPerformance);
        return result;
    }

    // ========== INTEGRATION BREAKDOWN ==========

    public Map<String, Object> computeIntegrationBreakdown(RelocationCityDataset city,
                                                             Map<String, Object> payload) {
        Map<String, Object> breakdown = new LinkedHashMap<>();

        BigDecimal housingScore = city.getMacroMercatoImmobiliare() != null
                ? city.getMacroMercatoImmobiliare() : BigDecimal.ZERO;
        breakdown.put("housing_stability", Map.of("score", housingScore, "label", "Housing Stability"));

        BigDecimal socialScore = city.getMacroIntegrazioneSociale() != null
                ? city.getMacroIntegrazioneSociale() : BigDecimal.ZERO;
        breakdown.put("social_integration", Map.of("score", socialScore, "label", "Social Integration"));

        BigDecimal professionalScore = city.getMacroOpportunitaLavorative() != null
                ? city.getMacroOpportunitaLavorative() : BigDecimal.ZERO;
        breakdown.put("professional_network", Map.of("score", professionalScore, "label", "Professional Network"));

        BigDecimal costoVita = city.getMacroCostoVita() != null ? city.getMacroCostoVita() : BigDecimal.ZERO;
        BigDecimal potereEco = city.getMacroPotereEconomico() != null ? city.getMacroPotereEconomico() : BigDecimal.ZERO;
        BigDecimal costSustainability = costoVita.add(potereEco)
                .divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP);
        breakdown.put("cost_sustainability", Map.of("score", costSustainability, "label", "Cost Sustainability"));

        return breakdown;
    }

    // ========== UTILITY ==========

    public boolean isFamily(Map<String, Object> payload) {
        Object household = payload.get("household");
        return household instanceof String h && (h.contains("children") || h.contains("family"));
    }

    public BigDecimal getBudgetFromPayload(Map<String, Object> payload) {
        Object budget = payload.get("monthlyBudget");
        if (budget instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        if (budget instanceof String s) {
            try { return new BigDecimal(s); } catch (NumberFormatException e) { return BigDecimal.ZERO; }
        }
        return BigDecimal.ZERO;
    }

    public BigDecimal getLifestyleMultiplier(Map<String, Object> payload, RelocationScoringConfig config) {
        String lifestyle = payload.get("desiredLifestyle") instanceof String s ? s : "balanced";
        Map<String, Object> multipliers = config.getLifestyleMultipliers();
        double value = getDoubleThreshold(multipliers, lifestyle, 1.0);
        return BigDecimal.valueOf(value);
    }

    public double getDoubleThreshold(Map<String, Object> map, String key, double defaultValue) {
        if (map == null) return defaultValue;
        Object val = map.get(key);
        if (val instanceof Number n) return n.doubleValue();
        if (val instanceof String s) {
            try { return Double.parseDouble(s); } catch (NumberFormatException e) { return defaultValue; }
        }
        return defaultValue;
    }

    public int getIntThreshold(Map<String, Object> map, String key, int defaultValue) {
        if (map == null) return defaultValue;
        Object val = map.get(key);
        if (val instanceof Number n) return n.intValue();
        if (val instanceof String s) {
            try { return Integer.parseInt(s); } catch (NumberFormatException e) { return defaultValue; }
        }
        return defaultValue;
    }

    public double round(double value, int places) {
        return BigDecimal.valueOf(value).setScale(places, RoundingMode.HALF_UP).doubleValue();
    }

    // ========== MESSAGE BUILDERS ==========

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
}
