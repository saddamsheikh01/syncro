package com.syncro.backend.domain.matchmaking.service;

import com.syncro.backend.domain.matchmaking.dto.DimensionScores;
import com.syncro.backend.domain.matchmaking.dto.DomainScores;
import com.syncro.backend.domain.matchmaking.entity.MatchDomain;
import java.util.EnumMap;
import java.util.Map;
import org.springframework.stereotype.Service;

/**
 * Servizio per il calcolo dei punteggi per ogni dominio di compatibilita.
 * Ogni dominio ha pesi diversi per le dimensioni.
 * Se una dimensione non e disponibile, i pesi vengono redistribuiti.
 */
@Service
public class DomainScoreCalculator {

    // Pesi per ogni dominio (in percentuale, devono sommare a 100)
    private static final Map<MatchDomain, DomainWeights> DOMAIN_WEIGHTS = new EnumMap<>(MatchDomain.class);

    static {
        // Love: focus su valori, psy e astro
        DOMAIN_WEIGHTS.put(MatchDomain.LOVE, new DomainWeights(10, 15, 30, 10, 25, 10));
        // Friendship: focus su interessi e lifestyle
        DOMAIN_WEIGHTS.put(MatchDomain.FRIENDSHIP, new DomainWeights(30, 25, 20, 5, 15, 5));
        // Work: focus su obiettivi e valori
        DOMAIN_WEIGHTS.put(MatchDomain.WORK, new DomainWeights(10, 15, 25, 30, 20, 0));
        // Projects: focus su obiettivi e interessi
        DOMAIN_WEIGHTS.put(MatchDomain.PROJECTS, new DomainWeights(25, 10, 20, 35, 10, 0));
        // Hobby: focus su interessi e lifestyle
        DOMAIN_WEIGHTS.put(MatchDomain.HOBBY, new DomainWeights(40, 30, 15, 0, 15, 0));
        // Growth: focus su psy, obiettivi e valori
        DOMAIN_WEIGHTS.put(MatchDomain.GROWTH, new DomainWeights(10, 20, 25, 25, 20, 0));
    }

    /**
     * Calcola i punteggi per tutti i domini.
     */
    public DomainScores calculate(DimensionScores dimensions) {
        return new DomainScores(
            calculateDomainScore(MatchDomain.LOVE, dimensions),
            calculateDomainScore(MatchDomain.FRIENDSHIP, dimensions),
            calculateDomainScore(MatchDomain.WORK, dimensions),
            calculateDomainScore(MatchDomain.PROJECTS, dimensions),
            calculateDomainScore(MatchDomain.HOBBY, dimensions),
            calculateDomainScore(MatchDomain.GROWTH, dimensions)
        );
    }

    /**
     * Calcola il punteggio totale come media ponderata dei domini.
     */
    public int calculateTotalScore(DomainScores domains) {
        return domains.average();
    }

    /**
     * Calcola il punteggio per un singolo dominio.
     * Redistribuisce i pesi se alcune dimensioni non sono disponibili.
     */
    private Integer calculateDomainScore(MatchDomain domain, DimensionScores dimensions) {
        if (!dimensions.hasAnyDimension()) {
            return null;
        }

        DomainWeights weights = DOMAIN_WEIGHTS.get(domain);
        if (weights == null) {
            return null;
        }

        // Calcola i pesi effettivi (redistribuiti se dimensioni mancanti)
        double totalWeight = 0;
        double weightedSum = 0;

        if (dimensions.interests() != null && weights.interests > 0) {
            totalWeight += weights.interests;
            weightedSum += dimensions.interests() * weights.interests;
        }
        if (dimensions.lifestyle() != null && weights.lifestyle > 0) {
            totalWeight += weights.lifestyle;
            weightedSum += dimensions.lifestyle() * weights.lifestyle;
        }
        if (dimensions.values() != null && weights.values > 0) {
            totalWeight += weights.values;
            weightedSum += dimensions.values() * weights.values;
        }
        if (dimensions.objectives() != null && weights.objectives > 0) {
            totalWeight += weights.objectives;
            weightedSum += dimensions.objectives() * weights.objectives;
        }
        if (dimensions.psy() != null && weights.psy > 0) {
            totalWeight += weights.psy;
            weightedSum += dimensions.psy() * weights.psy;
        }
        if (dimensions.astro() != null && weights.astro > 0) {
            totalWeight += weights.astro;
            weightedSum += dimensions.astro() * weights.astro;
        }

        if (totalWeight == 0) {
            return null;
        }

        return (int) Math.round(weightedSum / totalWeight);
    }

    /**
     * Record per i pesi di un dominio.
     */
    private record DomainWeights(
        int interests,
        int lifestyle,
        int values,
        int objectives,
        int psy,
        int astro
    ) {}
}
