package com.syncro.backend.domain.expats.dto;

import com.fasterxml.jackson.annotation.JsonRawValue;
import com.fasterxml.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.UUID;

/**
 * Risposta per una singola risposta del funnel.
 * answerValue viene serializzato come JSON raw (non come bean Java).
 */
public record AnswerResponse(
        UUID id,
        Integer stepNumber,
        String questionGroup,
        String questionKey,
        @JsonRawValue Object answerValue,
        Instant answeredAt,
        Integer version
) {
    /**
     * Factory che converte il JsonNode in stringa JSON raw per la serializzazione.
     */
    public static AnswerResponse of(UUID id, Integer stepNumber, String questionGroup,
                                     String questionKey, JsonNode answerValue,
                                     Instant answeredAt, Integer version) {
        return new AnswerResponse(id, stepNumber, questionGroup, questionKey,
                answerValue != null ? answerValue.toString() : null,
                answeredAt, version);
    }
}
