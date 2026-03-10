package com.syncro.backend.domain.relocation.dto;

import jakarta.validation.constraints.Size;

import java.util.Map;

/**
 * DTO per aggiornamento parziale della configurazione scoring.
 * Campi nullable by design: null = campo non aggiornato.
 */
public record UpdateScoringConfigRequest(
        @Size(min = 1, message = "thresholds deve contenere almeno un elemento se fornito")
        Map<String, Object> thresholds,

        @Size(min = 1, message = "budgetMarginThresholds deve contenere almeno un elemento se fornito")
        Map<String, Object> budgetMarginThresholds,

        @Size(min = 1, message = "budgetPenaltyThresholds deve contenere almeno un elemento se fornito")
        Map<String, Object> budgetPenaltyThresholds,

        @Size(min = 1, message = "lifestyleMultipliers deve contenere almeno un elemento se fornito")
        Map<String, Object> lifestyleMultipliers,

        @Size(min = 1, message = "priorityThresholds deve contenere almeno un elemento se fornito")
        Map<String, Object> priorityThresholds,

        @Size(min = 1, message = "cityPerformanceThresholds deve contenere almeno un elemento se fornito")
        Map<String, Object> cityPerformanceThresholds
) {}
