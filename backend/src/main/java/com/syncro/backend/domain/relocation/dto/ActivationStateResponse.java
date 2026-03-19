package com.syncro.backend.domain.relocation.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Stato attivazione post-registrazione: mostra step completati,
 * step mancanti e le prossime azioni da compiere.
 */
public record ActivationStateResponse(
        String status,
        String userType,
        Integer completedSteps,
        Integer totalSteps,
        Integer completionPercent,
        List<String> completedFields,
        List<String> missingFields,
        List<Map<String, String>> nextActions,
        boolean hasActiveSnapshot,
        boolean hasScoringResults,
        Instant updatedAt
) {}
