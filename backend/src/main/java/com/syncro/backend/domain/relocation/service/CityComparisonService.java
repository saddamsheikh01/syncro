package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.expats.repository.ExpatsAnonymousSessionRepository;
import com.syncro.backend.domain.relocation.RelocationScoringConfigKeys;
import com.syncro.backend.domain.relocation.dto.CityComparisonRequest;
import com.syncro.backend.domain.relocation.dto.CityComparisonResponse;
import com.syncro.backend.domain.relocation.dto.CityComparisonResponse.*;
import com.syncro.backend.domain.relocation.entity.*;
import com.syncro.backend.domain.relocation.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;

/**
 * Service per il confronto tra due citta (WOW Page City Comparison).
 * L'utente vive in una citta e vuole valutare se trasferirsi in un'altra.
 * Confronta le 6 macroaree, calcola impatto economico, allineamento priorita e trade-off.
 */
@Service
public class CityComparisonService {

    private static final BigDecimal DELTA_NEUTRAL_THRESHOLD = new BigDecimal("1");
    private static final BigDecimal TRADEOFF_THRESHOLD = new BigDecimal("5");

    private final RelocationProfileRepository profileRepository;
    private final RelocationOnboardingSnapshotRepository snapshotRepository;
    private final RelocationCityDatasetRepository cityRepository;
    private final RelocationCityScoreRepository scoreRepository;
    private final RelocationScoringConfigRepository configRepository;
    private final UserRepository userRepository;
    private final ScoringCalculationHelper helper;
    private final AnonymousRelocationService anonymousRelocationService;
    private final ExpatsAnonymousSessionRepository expatsSessionRepository;

    public CityComparisonService(RelocationProfileRepository profileRepository,
                                  RelocationOnboardingSnapshotRepository snapshotRepository,
                                  RelocationCityDatasetRepository cityRepository,
                                  RelocationCityScoreRepository scoreRepository,
                                  RelocationScoringConfigRepository configRepository,
                                  UserRepository userRepository,
                                  ScoringCalculationHelper helper,
                                  AnonymousRelocationService anonymousRelocationService,
                                  ExpatsAnonymousSessionRepository expatsSessionRepository) {
        this.profileRepository = profileRepository;
        this.snapshotRepository = snapshotRepository;
        this.cityRepository = cityRepository;
        this.scoreRepository = scoreRepository;
        this.configRepository = configRepository;
        this.userRepository = userRepository;
        this.helper = helper;
        this.anonymousRelocationService = anonymousRelocationService;
        this.expatsSessionRepository = expatsSessionRepository;
    }

    @Transactional
    public CityComparisonResponse compareCities(UUID userId, CityComparisonRequest request) {
        profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Relocation profile not found"));

        RelocationOnboardingSnapshot snapshot = snapshotRepository.findByUserIdAndIsActiveTrue(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                        "No active snapshot found. Complete onboarding and create a snapshot first."));

        RelocationScoringConfig config = configRepository.findByConfigKeyAndActiveTrue(RelocationScoringConfigKeys.ACTIVE)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Scoring configuration not found"));

        // 2. Caricare le due citta
        RelocationCityDataset currentCity = cityRepository.findById(request.currentCityId())
                .filter(c -> Boolean.TRUE.equals(c.getActive()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Current city not found or inactive"));

        RelocationCityDataset targetCity = cityRepository.findById(request.targetCityId())
                .filter(c -> Boolean.TRUE.equals(c.getActive()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Target city not found or inactive"));

        // 3. Calcolare pesi utente
        Map<String, Double> rawWeights = helper.accumulateUserWeights(snapshot.getPayload());
        helper.applyHardFilters(rawWeights, snapshot.getPayload());
        Map<String, Double> normalizedWeights = helper.normalizeWeights(rawWeights);
        Map<String, String> priorityClassification = helper.classifyPriorities(normalizedWeights, config);

        // 4. Ottenere macroaree di entrambe le citta
        Map<String, BigDecimal> currentMacroaree = helper.getCityMacroareeMap(currentCity);
        Map<String, BigDecimal> targetMacroaree = helper.getCityMacroareeMap(targetCity);

        // 5. Calcolare confronto macroaree
        List<MacroareaComparison> macroareeComparison = buildMacroareeComparison(currentMacroaree, targetMacroaree);

        // 6. Calcolare impatto economico
        boolean isFamily = helper.isFamily(snapshot.getPayload());
        EconomicImpact economicImpact = buildEconomicImpact(currentCity, targetCity, isFamily);

        // 7. Calcolare allineamento priorita
        PriorityAlignment priorityAlignment = buildPriorityAlignment(
                currentMacroaree, targetMacroaree, priorityClassification, targetCity.getCityName());

        // 8. Calcolare trade-off
        List<TradeOff> tradeOffs = buildTradeOffs(currentMacroaree, targetMacroaree, currentCity.getCityName());

        // 9. Calcolare overall impact
        int scoreCurrentCity = helper.computeCityFitScore(currentCity, normalizedWeights, config, snapshot.getPayload());
        int scoreTargetCity = helper.computeCityFitScore(targetCity, normalizedWeights, config, snapshot.getPayload());
        String compatCurrent = helper.classifyCompatibility(scoreCurrentCity, config);
        String compatTarget = helper.classifyCompatibility(scoreTargetCity, config);

        OverallImpact overallImpact = buildOverallImpact(
                currentCity, targetCity, scoreCurrentCity, scoreTargetCity,
                compatCurrent, compatTarget, macroareeComparison, economicImpact);

        persistComparisonScore(userId, snapshot, currentCity, targetCity, scoreTargetCity,
                normalizedWeights, priorityClassification, config);

        return new CityComparisonResponse(
                new CityInfo(currentCity.getId(), currentCity.getCityName(), currentCity.getCountry(), currentCity.getCitySlug()),
                new CityInfo(targetCity.getId(), targetCity.getCityName(), targetCity.getCountry(), targetCity.getCitySlug()),
                macroareeComparison,
                economicImpact,
                priorityAlignment,
                tradeOffs,
                overallImpact,
                normalizedWeights,
                priorityClassification,
                ScoringCalculationHelper.ALGORITHM_VERSION
        );
    }

    @Transactional
    public CityComparisonResponse compareCitiesAnonymous(UUID sessionId, CityComparisonRequest request) {
        anonymousRelocationService.refreshActiveSnapshot(sessionId);
        profileRepository.findByAnonymousSession_Id(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Relocation profile not found"));
        RelocationOnboardingSnapshot snapshot = snapshotRepository.findByAnonymousSession_IdOrderByVersionDesc(sessionId).stream()
                .filter(s -> Boolean.TRUE.equals(s.getIsActive()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                        "No active snapshot. Complete the funnel first."));

        RelocationScoringConfig config = configRepository.findByConfigKeyAndActiveTrue(RelocationScoringConfigKeys.ACTIVE)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Scoring configuration not found"));

        RelocationCityDataset currentCity = cityRepository.findById(request.currentCityId())
                .filter(c -> Boolean.TRUE.equals(c.getActive()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Current city not found or inactive"));

        RelocationCityDataset targetCity = cityRepository.findById(request.targetCityId())
                .filter(c -> Boolean.TRUE.equals(c.getActive()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Target city not found or inactive"));

        Map<String, Double> rawWeights = helper.accumulateUserWeights(snapshot.getPayload());
        helper.applyHardFilters(rawWeights, snapshot.getPayload());
        Map<String, Double> normalizedWeights = helper.normalizeWeights(rawWeights);
        Map<String, String> priorityClassification = helper.classifyPriorities(normalizedWeights, config);

        Map<String, BigDecimal> currentMacroaree = helper.getCityMacroareeMap(currentCity);
        Map<String, BigDecimal> targetMacroaree = helper.getCityMacroareeMap(targetCity);

        List<MacroareaComparison> macroareeComparison = buildMacroareeComparison(currentMacroaree, targetMacroaree);
        boolean isFamily = helper.isFamily(snapshot.getPayload());
        EconomicImpact economicImpact = buildEconomicImpact(currentCity, targetCity, isFamily);
        PriorityAlignment priorityAlignment = buildPriorityAlignment(
                currentMacroaree, targetMacroaree, priorityClassification, targetCity.getCityName());
        List<TradeOff> tradeOffs = buildTradeOffs(currentMacroaree, targetMacroaree, currentCity.getCityName());

        int scoreCurrentCity = helper.computeCityFitScore(currentCity, normalizedWeights, config, snapshot.getPayload());
        int scoreTargetCity = helper.computeCityFitScore(targetCity, normalizedWeights, config, snapshot.getPayload());
        String compatCurrent = helper.classifyCompatibility(scoreCurrentCity, config);
        String compatTarget = helper.classifyCompatibility(scoreTargetCity, config);

        OverallImpact overallImpact = buildOverallImpact(
                currentCity, targetCity, scoreCurrentCity, scoreTargetCity,
                compatCurrent, compatTarget, macroareeComparison, economicImpact);

        persistComparisonScoreAnonymous(sessionId, snapshot, currentCity, targetCity, scoreTargetCity,
                normalizedWeights, priorityClassification, config);

        return new CityComparisonResponse(
                new CityInfo(currentCity.getId(), currentCity.getCityName(), currentCity.getCountry(), currentCity.getCitySlug()),
                new CityInfo(targetCity.getId(), targetCity.getCityName(), targetCity.getCountry(), targetCity.getCitySlug()),
                macroareeComparison,
                economicImpact,
                priorityAlignment,
                tradeOffs,
                overallImpact,
                normalizedWeights,
                priorityClassification,
                ScoringCalculationHelper.ALGORITHM_VERSION
        );
    }

    private static String macroareaDisplayName(String key) {
        return switch (key) {
            case "costo_vita" -> "cost of living";
            case "mercato_immobiliare" -> "housing market";
            case "potere_economico" -> "economic power";
            case "qualita_vita" -> "quality of life";
            case "opportunita_lavorative" -> "work opportunities";
            case "integrazione_sociale" -> "social integration";
            default -> key.replace("_", " ");
        };
    }

    // ========== BUILDERS ==========

    private List<MacroareaComparison> buildMacroareeComparison(
            Map<String, BigDecimal> currentMacroaree, Map<String, BigDecimal> targetMacroaree) {

        List<MacroareaComparison> comparisons = new ArrayList<>();
        for (String key : ScoringCalculationHelper.MACROAREA_KEYS) {
            BigDecimal currentScore = currentMacroaree.getOrDefault(key, BigDecimal.ZERO);
            BigDecimal targetScore = targetMacroaree.getOrDefault(key, BigDecimal.ZERO);
            BigDecimal delta = targetScore.subtract(currentScore).setScale(2, RoundingMode.HALF_UP);

            String direction;
            if (delta.compareTo(DELTA_NEUTRAL_THRESHOLD) > 0) {
                direction = "improvement";
            } else if (delta.compareTo(DELTA_NEUTRAL_THRESHOLD.negate()) < 0) {
                direction = "decline";
            } else {
                direction = "neutral";
            }

            comparisons.add(new MacroareaComparison(key, currentScore, targetScore, delta, direction));
        }
        return comparisons;
    }

    private EconomicImpact buildEconomicImpact(RelocationCityDataset currentCity,
                                                 RelocationCityDataset targetCity, boolean isFamily) {
        BigDecimal currentCost = helper.computeCityCost(currentCity, isFamily);
        BigDecimal targetCost = helper.computeCityCost(targetCity, isFamily);
        BigDecimal saving = currentCost.subtract(targetCost).setScale(2, RoundingMode.HALF_UP);

        BigDecimal curLiving = isFamily
                ? currentCity.getCostFamilyNoRent()
                : currentCity.getCostSingleNoRent();
        BigDecimal curRent = isFamily
                ? currentCity.getApartment3brCenter()
                : currentCity.getApartment1brCenter();
        BigDecimal tgtLiving = isFamily
                ? targetCity.getCostFamilyNoRent()
                : targetCity.getCostSingleNoRent();
        BigDecimal tgtRent = isFamily
                ? targetCity.getApartment3brCenter()
                : targetCity.getApartment1brCenter();

        String summary;
        if (saving.compareTo(BigDecimal.ZERO) > 0) {
            summary = "Moving to " + targetCity.getCityName() + " could reduce your monthly cost by ~€"
                    + saving.abs().setScale(0, RoundingMode.HALF_UP) + ".";
        } else if (saving.compareTo(BigDecimal.ZERO) < 0) {
            summary = "Moving to " + targetCity.getCityName() + " could increase your monthly cost by ~€"
                    + saving.abs().setScale(0, RoundingMode.HALF_UP) + ".";
        } else {
            summary = "Monthly costs are similar between " + currentCity.getCityName()
                    + " and " + targetCity.getCityName() + ".";
        }

        return new EconomicImpact(currentCost, targetCost, saving, isFamily, summary,
                curLiving, curRent, tgtLiving, tgtRent);
    }

    private PriorityAlignment buildPriorityAlignment(
            Map<String, BigDecimal> currentMacroaree, Map<String, BigDecimal> targetMacroaree,
            Map<String, String> priorityClassification, String targetCityName) {

        List<String> aligned = new ArrayList<>();
        for (String key : ScoringCalculationHelper.MACROAREA_KEYS) {
            String priority = priorityClassification.getOrDefault(key, "LOW");
            boolean isHighPriority = "VERY_HIGH".equals(priority) || "HIGH".equals(priority);

            if (isHighPriority) {
                BigDecimal targetScore = targetMacroaree.getOrDefault(key, BigDecimal.ZERO);
                BigDecimal currentScore = currentMacroaree.getOrDefault(key, BigDecimal.ZERO);
                if (targetScore.compareTo(currentScore) > 0) {
                    aligned.add(key);
                }
            }
        }

        String summary;
        if (aligned.isEmpty()) {
            summary = "Your top priorities are better served by your current city.";
        } else {
            String priorityNames = String.join(", ", aligned.stream()
                    .map(CityComparisonService::macroareaDisplayName)
                    .toList());
            summary = targetCityName + " aligns strongly with your priorities of " + priorityNames + ".";
        }

        return new PriorityAlignment(aligned, summary);
    }

    private List<TradeOff> buildTradeOffs(Map<String, BigDecimal> currentMacroaree,
                                            Map<String, BigDecimal> targetMacroaree,
                                            String currentCityName) {
        List<TradeOff> tradeOffs = new ArrayList<>();
        for (String key : ScoringCalculationHelper.MACROAREA_KEYS) {
            BigDecimal currentScore = currentMacroaree.getOrDefault(key, BigDecimal.ZERO);
            BigDecimal targetScore = targetMacroaree.getOrDefault(key, BigDecimal.ZERO);
            BigDecimal diff = currentScore.subtract(targetScore);

            if (diff.compareTo(TRADEOFF_THRESHOLD) >= 0) {
                String macroareaLabel = key.replace("_", " ");
                String message = macroareaLabel.substring(0, 1).toUpperCase() + macroareaLabel.substring(1)
                        + " is slightly stronger in " + currentCityName
                        + ". If your priority shifts toward this area, it may be a factor to consider.";
                tradeOffs.add(new TradeOff(key, message));
            }
        }
        return tradeOffs;
    }

    private OverallImpact buildOverallImpact(RelocationCityDataset currentCity, RelocationCityDataset targetCity,
                                               int scoreCurrentCity, int scoreTargetCity,
                                               String compatCurrent, String compatTarget,
                                               List<MacroareaComparison> comparisons,
                                               EconomicImpact economicImpact) {
        long improvements = comparisons.stream().filter(c -> "improvement".equals(c.direction())).count();
        long declines = comparisons.stream().filter(c -> "decline".equals(c.direction())).count();

        StringBuilder summary = new StringBuilder();
        summary.append(targetCity.getCityName());

        if (improvements > declines) {
            summary.append(" improves ");
            List<String> improved = comparisons.stream()
                    .filter(c -> "improvement".equals(c.direction()))
                    .map(c -> c.macroarea().replace("_", " "))
                    .limit(3)
                    .toList();
            summary.append(String.join(", ", improved));
        } else if (declines > improvements) {
            summary.append(" shows lower scores in some areas compared to ").append(currentCity.getCityName());
        } else {
            summary.append(" and ").append(currentCity.getCityName()).append(" show comparable performance");
        }

        if (economicImpact.monthlySaving().compareTo(BigDecimal.ZERO) > 0) {
            summary.append(" while also reducing cost of living");
        } else if (economicImpact.monthlySaving().compareTo(BigDecimal.ZERO) < 0) {
            summary.append(" while slightly increasing cost of living");
        }

        if (declines > 0 && improvements > declines) {
            List<String> declined = comparisons.stream()
                    .filter(c -> "decline".equals(c.direction()))
                    .map(c -> c.macroarea().replace("_", " "))
                    .limit(2)
                    .toList();
            summary.append(", while slightly reducing access to ").append(String.join(", ", declined));
        }
        summary.append(".");

        return new OverallImpact(
                summary.toString(),
                scoreCurrentCity,
                scoreTargetCity,
                compatCurrent,
                compatTarget
        );
    }

    // ========== PERSISTENCE ==========

    private void persistComparisonScore(UUID userId, RelocationOnboardingSnapshot snapshot,
                                         RelocationCityDataset currentCity, RelocationCityDataset targetCity,
                                         int scoreTargetCity,
                                         Map<String, Double> normalizedWeights,
                                         Map<String, String> priorityClassification,
                                         RelocationScoringConfig config) {

        Map<String, BigDecimal> targetMacroaree = helper.getCityMacroareeMap(targetCity);
        String compatibilityLevel = helper.classifyCompatibility(scoreTargetCity, config);

        Map<String, Object> breakdown = new LinkedHashMap<>(targetMacroaree);
        Map<String, Object> comparisonMeta = new LinkedHashMap<>();
        comparisonMeta.put("currentCityId", currentCity.getId().toString());
        comparisonMeta.put("currentCityName", currentCity.getCityName());
        breakdown.put("comparisonMeta", comparisonMeta);

        RelocationCityScore score = new RelocationCityScore();
        score.setUser(userRepository.getReferenceById(userId));
        score.setSnapshot(snapshot);
        score.setCity(targetCity);
        score.setAnalysisType("city_comparison");
        score.setScoreTotal(scoreTargetCity);
        score.setCompatibilityLevel(compatibilityLevel);
        score.setBreakdown(breakdown);
        score.setUserWeights(new LinkedHashMap<>(normalizedWeights));
        score.setUserPriorityClassification(new LinkedHashMap<>(priorityClassification));
        score.setRadarValues(new LinkedHashMap<>(targetMacroaree));
        score.setAlgorithmVersion(ScoringCalculationHelper.ALGORITHM_VERSION);
        score.setComputedAt(Instant.now());
        score.setRankingPosition(1);

        scoreRepository.save(score);
    }

    private void persistComparisonScoreAnonymous(UUID sessionId, RelocationOnboardingSnapshot snapshot,
                                                 RelocationCityDataset currentCity, RelocationCityDataset targetCity,
                                                 int scoreTargetCity,
                                                 Map<String, Double> normalizedWeights,
                                                 Map<String, String> priorityClassification,
                                                 RelocationScoringConfig config) {

        Map<String, BigDecimal> targetMacroaree = helper.getCityMacroareeMap(targetCity);
        String compatibilityLevel = helper.classifyCompatibility(scoreTargetCity, config);

        Map<String, Object> breakdown = new LinkedHashMap<>(targetMacroaree);
        Map<String, Object> comparisonMeta = new LinkedHashMap<>();
        comparisonMeta.put("currentCityId", currentCity.getId().toString());
        comparisonMeta.put("currentCityName", currentCity.getCityName());
        breakdown.put("comparisonMeta", comparisonMeta);

        RelocationCityScore score = new RelocationCityScore();
        score.setAnonymousSession(expatsSessionRepository.getReferenceById(sessionId));
        score.setSnapshot(snapshot);
        score.setCity(targetCity);
        score.setAnalysisType("city_comparison");
        score.setScoreTotal(scoreTargetCity);
        score.setCompatibilityLevel(compatibilityLevel);
        score.setBreakdown(breakdown);
        score.setUserWeights(new LinkedHashMap<>(normalizedWeights));
        score.setUserPriorityClassification(new LinkedHashMap<>(priorityClassification));
        score.setRadarValues(new LinkedHashMap<>(targetMacroaree));
        score.setAlgorithmVersion(ScoringCalculationHelper.ALGORITHM_VERSION);
        score.setComputedAt(Instant.now());
        score.setRankingPosition(1);

        scoreRepository.save(score);
    }
}
