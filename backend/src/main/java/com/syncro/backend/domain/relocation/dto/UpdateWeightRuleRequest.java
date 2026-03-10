package com.syncro.backend.domain.relocation.dto;

import jakarta.validation.constraints.Size;

import java.util.Map;

/**
 * DTO per aggiornamento parziale weight rule.
 * Campi nullable by design: null = campo non aggiornato.
 */
public record UpdateWeightRuleRequest(
        @Size(min = 1, message = "weightAdjustments deve contenere almeno un elemento se fornito")
        Map<String, Integer> weightAdjustments,

        Boolean active
) {}
