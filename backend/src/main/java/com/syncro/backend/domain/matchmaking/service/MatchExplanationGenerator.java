package com.syncro.backend.domain.matchmaking.service;

import com.syncro.backend.domain.matchmaking.dto.DimensionScores;
import com.syncro.backend.domain.matchmaking.dto.DomainScores;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Servizio per la generazione di spiegazioni testuali per i match.
 */
@Service
public class MatchExplanationGenerator {

    private static final int MAX_EXPLANATIONS = 3;
    private static final int HIGH_SCORE_THRESHOLD = 70;
    private static final int VERY_HIGH_SCORE_THRESHOLD = 85;

    /**
     * Genera una lista di spiegazioni per un match.
     * Restituisce i 2-3 motivi principali del match.
     */
    public List<String> generate(DimensionScores dimensions, DomainScores domains) {
        List<ExplanationCandidate> candidates = new ArrayList<>();

        // Aggiungi spiegazioni basate sugli interessi condivisi
        if (dimensions.sharedTags() != null && !dimensions.sharedTags().isEmpty()) {
            int count = dimensions.sharedTags().size();
            String tagsPreview = String.join(", ", dimensions.sharedTags().stream().limit(3).toList());
            if (count > 3) {
                tagsPreview += "...";
            }
            int priority = count >= 5 ? 100 : count >= 3 ? 80 : 60;
            candidates.add(new ExplanationCandidate(
                priority,
                "Condividete " + count + " passioni: " + tagsPreview
            ));
        }

        // Spiegazioni basate sulle dimensioni
        addDimensionExplanation(candidates, "Valori molto affini", dimensions.values());
        addDimensionExplanation(candidates, "Stile di vita compatibile", dimensions.lifestyle());
        addDimensionExplanation(candidates, "Obiettivi simili", dimensions.objectives());
        addDimensionExplanation(candidates, "Personalita compatibili", dimensions.psy());
        addDimensionExplanation(candidates, "Ottima compatibilita astrologica", dimensions.astro());

        // Spiegazioni basate sui domini
        addDomainExplanation(candidates, "Ottimi per una relazione", domains.love());
        addDomainExplanation(candidates, "Ottimi per un'amicizia", domains.friendship());
        addDomainExplanation(candidates, "Potenziale collaborazione lavorativa", domains.work());
        addDomainExplanation(candidates, "Ideali per progetti insieme", domains.projects());
        addDomainExplanation(candidates, "Condividete hobby simili", domains.hobby());
        addDomainExplanation(candidates, "Potete crescere insieme", domains.growth());

        // Ordina per priorita e prendi i top 3
        candidates.sort(Comparator.comparingInt(ExplanationCandidate::priority).reversed());

        return candidates.stream()
            .limit(MAX_EXPLANATIONS)
            .map(ExplanationCandidate::text)
            .toList();
    }

    /**
     * Genera una spiegazione singola (per retrocompatibilita).
     */
    public String generateSingle(DimensionScores dimensions, DomainScores domains) {
        List<String> explanations = generate(dimensions, domains);
        if (explanations.isEmpty()) {
            return "Match basato su compatibilita generale";
        }
        return String.join(". ", explanations);
    }

    private void addDimensionExplanation(List<ExplanationCandidate> candidates, String text, Integer score) {
        if (score == null) {
            return;
        }
        if (score >= VERY_HIGH_SCORE_THRESHOLD) {
            candidates.add(new ExplanationCandidate(score, text + " (" + score + "%)"));
        } else if (score >= HIGH_SCORE_THRESHOLD) {
            candidates.add(new ExplanationCandidate(score - 10, text + " (" + score + "%)"));
        }
    }

    private void addDomainExplanation(List<ExplanationCandidate> candidates, String text, Integer score) {
        if (score == null) {
            return;
        }
        if (score >= VERY_HIGH_SCORE_THRESHOLD) {
            candidates.add(new ExplanationCandidate(score - 5, text));
        }
    }

    private record ExplanationCandidate(int priority, String text) {}
}
