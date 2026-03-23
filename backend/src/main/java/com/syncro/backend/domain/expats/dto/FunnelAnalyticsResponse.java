package com.syncro.backend.domain.expats.dto;

import java.util.List;
import java.util.Map;

/**
 * KPI aggregate del funnel expats per il backoffice admin.
 */
public record FunnelAnalyticsResponse(
        // Contatori generali
        long totalSessions,
        long completedSessions,
        long convertedSessions,
        long expiredSessions,
        long inProgressSessions,
        double completionRate,
        double conversionRate,

        // Drop-off per step: quante sessioni si sono fermate a ogni step
        List<StepDropOff> stepDropOff,

        // Citta piu richieste (dal funnel, incluse quelle non nel catalogo)
        List<CityCount> topTargetCities,
        List<CityCount> topCurrentCities,

        // Risposte aggregate per domanda
        List<AnswerDistribution> answerDistributions,

        // Citta in waiting list piu richieste
        List<CityCount> waitingListTop
) {
    public record StepDropOff(
            int step,
            long sessionsReached,
            long sessionsDropped,
            double dropOffRate
    ) {}

    public record CityCount(
            String cityName,
            long count
    ) {}

    public record AnswerDistribution(
            String questionKey,
            Map<String, Long> valueCounts
    ) {}
}
