package com.syncro.backend.domain.matchmaking.service;

import com.syncro.backend.domain.matchmaking.dto.DimensionScores;
import com.syncro.backend.domain.profile.entity.UserProfile;
import com.syncro.backend.domain.profile.entity.ZodiacSign;
import com.syncro.backend.domain.profile.repository.UserProfileRepository;
import com.syncro.backend.domain.tags.entity.Tag;
import com.syncro.backend.domain.tags.entity.UserInterest;
import com.syncro.backend.domain.tags.repository.UserInterestRepository;
import com.syncro.backend.domain.tests.entity.TestType;
import com.syncro.backend.domain.tests.entity.UserPsyProfile;
import com.syncro.backend.domain.tests.repository.UserPsyProfileRepository;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

/**
 * Servizio per il calcolo dei punteggi per ogni dimensione di valutazione.
 */
@Service
public class DimensionScoreCalculator {

    private final UserInterestRepository userInterestRepository;
    private final UserPsyProfileRepository userPsyProfileRepository;
    private final UserProfileRepository userProfileRepository;

    public DimensionScoreCalculator(
        UserInterestRepository userInterestRepository,
        UserPsyProfileRepository userPsyProfileRepository,
        UserProfileRepository userProfileRepository
    ) {
        this.userInterestRepository = userInterestRepository;
        this.userPsyProfileRepository = userPsyProfileRepository;
        this.userProfileRepository = userProfileRepository;
    }

    /**
     * Calcola tutti i punteggi dimensionali tra due utenti.
     */
    public DimensionScores calculate(UUID userAId, UUID userBId) {
        // Interessi
        List<UserInterest> interestsA = userInterestRepository.findAllByUserId(userAId);
        List<UserInterest> interestsB = userInterestRepository.findAllByUserId(userBId);
        Set<UUID> tagsA = interestsA.stream().map(UserInterest::getTagId).collect(Collectors.toSet());
        Set<UUID> tagsB = interestsB.stream().map(UserInterest::getTagId).collect(Collectors.toSet());

        Integer interestsScore = calculateJaccardSimilarity(tagsA, tagsB);
        List<String> sharedTags = findSharedTagNames(interestsA, interestsB);

        // Profili psicologici
        UserPsyProfile psyProfileA = userPsyProfileRepository.findByUserId(userAId).orElse(null);
        UserPsyProfile psyProfileB = userPsyProfileRepository.findByUserId(userBId).orElse(null);

        Integer lifestyleScore = normalizeScore(calculateTestScore(psyProfileA, psyProfileB, TestType.LIFESTYLE));
        Integer valuesScore = normalizeScore(calculateTestScore(psyProfileA, psyProfileB, TestType.VALUES));
        Integer objectivesScore = normalizeScore(calculateTestScore(psyProfileA, psyProfileB, TestType.OBJECTIVES));
        Integer psyScore = normalizeScore(calculateTestScore(psyProfileA, psyProfileB, TestType.PSY));

        // Astrologia
        UserProfile profileA = userProfileRepository.findByUserId(userAId).orElse(null);
        UserProfile profileB = userProfileRepository.findByUserId(userBId).orElse(null);
        Integer astroScore = normalizeScore(calculateAstroScore(profileA, profileB));

        return new DimensionScores(
            normalizeScore(interestsScore),
            lifestyleScore,
            valuesScore,
            objectivesScore,
            psyScore,
            astroScore,
            sharedTags,
            null // distanceKm non ancora implementato
        );
    }

    /**
     * Calcola la similarita Jaccard tra due insiemi di tag.
     * Restituisce un punteggio 0-100.
     */
    private Integer calculateJaccardSimilarity(Set<UUID> tagsA, Set<UUID> tagsB) {
        if (tagsA.isEmpty() && tagsB.isEmpty()) {
            return null;
        }
        if (tagsA.isEmpty() || tagsB.isEmpty()) {
            return 0;
        }
        Set<UUID> intersection = new HashSet<>(tagsA);
        intersection.retainAll(tagsB);
        Set<UUID> union = new HashSet<>(tagsA);
        union.addAll(tagsB);
        if (union.isEmpty()) {
            return 0;
        }
        double similarity = (double) intersection.size() / union.size();
        return (int) Math.round(similarity * 100);
    }

    /**
     * Trova i nomi dei tag condivisi tra due utenti.
     */
    private List<String> findSharedTagNames(List<UserInterest> interestsA, List<UserInterest> interestsB) {
        Set<UUID> tagsA = interestsA.stream().map(UserInterest::getTagId).collect(Collectors.toSet());
        Set<UUID> tagsB = interestsB.stream().map(UserInterest::getTagId).collect(Collectors.toSet());
        Set<UUID> sharedTagIds = new HashSet<>(tagsA);
        sharedTagIds.retainAll(tagsB);

        Map<UUID, String> tagNamesA = interestsA.stream()
            .filter(i -> i.getTag() != null)
            .collect(Collectors.toMap(UserInterest::getTagId, i -> i.getTag().getName(), (a, b) -> a));

        return sharedTagIds.stream()
            .map(tagNamesA::get)
            .filter(name -> name != null)
            .sorted()
            .limit(10)
            .toList();
    }

    /**
     * Calcola il punteggio di compatibilita per un tipo di test.
     */
    @SuppressWarnings("unchecked")
    private Integer calculateTestScore(UserPsyProfile profileA, UserPsyProfile profileB, TestType testType) {
        if (profileA == null || profileB == null) {
            return null;
        }
        Map<String, Object> dataA = profileA.getProfile();
        Map<String, Object> dataB = profileB.getProfile();
        if (dataA == null || dataB == null) {
            return null;
        }

        Object dimensionsA = dataA.get("dimensions");
        Object dimensionsB = dataB.get("dimensions");
        if (!(dimensionsA instanceof Map) || !(dimensionsB instanceof Map)) {
            return null;
        }

        String key = testType.name().toLowerCase();
        Object dimA = ((Map<String, Object>) dimensionsA).get(key);
        Object dimB = ((Map<String, Object>) dimensionsB).get(key);
        if (!(dimA instanceof Map) || !(dimB instanceof Map)) {
            return null;
        }

        Map<String, Object> dimensionA = (Map<String, Object>) dimA;
        Map<String, Object> dimensionB = (Map<String, Object>) dimB;

        Object scoreA = dimensionA.get("score");
        Object scoreB = dimensionB.get("score");

        // Gestione diversa in base al tipo di score
        if (scoreA instanceof Number && scoreB instanceof Number) {
            // SINGLE_SCORE: similarita = 100 - |a - b|
            int a = ((Number) scoreA).intValue();
            int b = ((Number) scoreB).intValue();
            return Math.max(0, 100 - Math.abs(a - b));
        }

        if (scoreA instanceof Map && scoreB instanceof Map) {
            // CLUSTER_SCORE o AXES_SCORE: distanza coseno
            return calculateMapSimilarity((Map<String, Object>) scoreA, (Map<String, Object>) scoreB);
        }

        return null;
    }

    /**
     * Calcola la similarita tra due mappe di score (cluster o assi).
     * Usa la similarita del coseno normalizzata a 0-100.
     */
    private Integer calculateMapSimilarity(Map<String, Object> mapA, Map<String, Object> mapB) {
        Set<String> allKeys = new HashSet<>();
        allKeys.addAll(mapA.keySet());
        allKeys.addAll(mapB.keySet());

        if (allKeys.isEmpty()) {
            return null;
        }

        double dotProduct = 0;
        double normA = 0;
        double normB = 0;

        for (String key : allKeys) {
            double a = getNumericValue(mapA.get(key));
            double b = getNumericValue(mapB.get(key));
            dotProduct += a * b;
            normA += a * a;
            normB += b * b;
        }

        if (normA == 0 || normB == 0) {
            return 0;
        }

        double cosineSimilarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
        return (int) Math.round(cosineSimilarity * 100);
    }

    private double getNumericValue(Object value) {
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        return 0;
    }

    /**
     * Normalizza un punteggio assicurando che sia compreso tra 0 e 100.
     * I valori negativi diventano 0, i valori superiori a 100 diventano 100.
     */
    private Integer normalizeScore(Integer score) {
        if (score == null) {
            return null;
        }
        return Math.max(0, Math.min(100, score));
    }

    /**
     * Calcola il punteggio di compatibilita astrologica.
     * MVP: basato su elementi compatibili dei segni.
     */
    private Integer calculateAstroScore(UserProfile profileA, UserProfile profileB) {
        if (profileA == null || profileB == null) {
            return null;
        }

        int score = 0;
        int count = 0;

        // Sole (peso maggiore)
        Integer sunScore = calculateSignCompatibility(profileA.getSunSign(), profileB.getSunSign());
        if (sunScore != null) {
            score += sunScore * 3; // peso triplo
            count += 3;
        }

        // Luna
        Integer moonScore = calculateSignCompatibility(profileA.getMoonSign(), profileB.getMoonSign());
        if (moonScore != null) {
            score += moonScore * 2; // peso doppio
            count += 2;
        }

        // Ascendente
        Integer ascScore = calculateSignCompatibility(profileA.getAscSign(), profileB.getAscSign());
        if (ascScore != null) {
            score += ascScore;
            count += 1;
        }

        // Venere (importante per amore)
        Integer venusScore = calculateSignCompatibility(profileA.getVenusSign(), profileB.getVenusSign());
        if (venusScore != null) {
            score += venusScore * 2;
            count += 2;
        }

        // Marte
        Integer marsScore = calculateSignCompatibility(profileA.getMarsSign(), profileB.getMarsSign());
        if (marsScore != null) {
            score += marsScore;
            count += 1;
        }

        if (count == 0) {
            return null;
        }

        int raw = score / count;
        boolean hasBirthTimeA = profileA.getBirthTime() != null;
        boolean hasBirthTimeB = profileB.getBirthTime() != null;
        if (!hasBirthTimeA || !hasBirthTimeB) {
            raw = (int) Math.round(raw * 0.6);
        }
        return raw;
    }

    /**
     * Calcola la compatibilita tra due segni zodiacali.
     * - Stesso segno: 100
     * - Elementi compatibili (fuoco/aria, terra/acqua): 80
     * - Stesso elemento: 70
     * - Elementi non compatibili: 40
     */
    private Integer calculateSignCompatibility(ZodiacSign signA, ZodiacSign signB) {
        if (signA == null || signB == null) {
            return null;
        }
        if (signA == ZodiacSign.UNKNOWN || signB == ZodiacSign.UNKNOWN) {
            return null;
        }

        if (signA == signB) {
            return 100;
        }

        if (signA.getElement() == signB.getElement()) {
            return 70;
        }

        if (signA.isElementCompatible(signB)) {
            return 80;
        }

        return 40;
    }
}
