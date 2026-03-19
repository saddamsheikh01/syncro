package com.syncro.backend.domain.expats.dto;

import jakarta.validation.constraints.Size;

import java.util.Map;

/**
 * DTO per aggiornamento parziale della configurazione funnel.
 * Campi nullable by design: null = campo non aggiornato.
 */
public record UpdateFunnelConfigRequest(
        @Size(min = 1, message = "content deve contenere almeno un elemento se fornito")
        Map<String, Object> content,

        Map<String, Object> featureFlags,

        Boolean active
) {}
