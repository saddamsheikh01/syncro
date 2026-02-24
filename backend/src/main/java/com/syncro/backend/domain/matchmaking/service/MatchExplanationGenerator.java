package com.syncro.backend.domain.matchmaking.service;

import com.syncro.backend.domain.matchmaking.dto.DimensionScores;
import com.syncro.backend.domain.matchmaking.dto.DomainScores;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class MatchExplanationGenerator {

    private static final int MAX_EXPLANATIONS = 3;
    private static final int HIGH_SCORE_THRESHOLD = 70;
    private static final int VERY_HIGH_SCORE_THRESHOLD = 85;

    public List<String> generate(DimensionScores dimensions, DomainScores domains) {
        List<ExplanationCandidate> candidates = new ArrayList<>();

        if (dimensions.sharedTags() != null && !dimensions.sharedTags().isEmpty()) {
            int count = dimensions.sharedTags().size();
            String tagsPreview = String.join(", ", dimensions.sharedTags().stream().limit(3).toList());
            if (count > 3) {
                tagsPreview += "...";
            }
            int priority = count >= 5 ? 100 : count >= 3 ? 80 : 60;
            candidates.add(new ExplanationCandidate(
                priority,
                count + " shared interests: " + tagsPreview
            ));
        }

        addDimensionExplanation(candidates, "Strong alignment in values", dimensions.values());
        addDimensionExplanation(candidates, "Compatible lifestyle", dimensions.lifestyle());
        addDimensionExplanation(candidates, "Similar goals", dimensions.objectives());
        addDimensionExplanation(candidates, "Compatible psychological profile", dimensions.psy());
        addDimensionExplanation(candidates, "Strong astrological compatibility", dimensions.astro());
        addDimensionExplanation(candidates, "Shared interests", dimensions.interests());

        addDomainExplanation(candidates, "Strong match for relationship", domains.love());
        addDomainExplanation(candidates, "Strong match for friendship", domains.friendship());
        addDomainExplanation(candidates, "Good fit for collaboration and work", domains.work());
        addDomainExplanation(candidates, "Good fit for projects together", domains.projects());
        addDomainExplanation(candidates, "Shared hobbies", domains.hobby());
        addDomainExplanation(candidates, "Good potential for growth together", domains.growth());

        candidates.sort(Comparator.comparingInt(ExplanationCandidate::priority).reversed());

        return candidates.stream()
            .limit(MAX_EXPLANATIONS)
            .map(ExplanationCandidate::text)
            .toList();
    }

    public String generateSingle(DimensionScores dimensions, DomainScores domains) {
        List<String> explanations = generate(dimensions, domains);
        if (explanations.isEmpty()) {
            return null;
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
        } else if (score >= HIGH_SCORE_THRESHOLD) {
            candidates.add(new ExplanationCandidate(score - 15, text));
        }
    }

    private record ExplanationCandidate(int priority, String text) {}
}
