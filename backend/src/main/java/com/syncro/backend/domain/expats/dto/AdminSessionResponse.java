package com.syncro.backend.domain.expats.dto;

import com.fasterxml.jackson.annotation.JsonRawValue;
import com.fasterxml.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Risposta admin per sessione anonima funnel: stato, risposte, citta selezionata, conversione.
 */
public record AdminSessionResponse(
        UUID id,
        String status,
        String userType,
        Integer currentStep,
        Integer totalSteps,
        String targetCityName,
        String currentCityName,
        boolean converted,
        UUID convertedUserId,
        String convertedUserEmail,
        Instant convertedAt,
        Map<String, Object> metadata,
        List<AnswerSummary> answers,
        Instant createdAt,
        Instant updatedAt
) {
    public record AnswerSummary(
            String questionKey,
            String questionGroup,
            Integer stepNumber,
            @JsonRawValue Object answerValue,
            Integer version,
            Instant answeredAt
    ) {
        public static AnswerSummary of(String questionKey, String questionGroup,
                                        Integer stepNumber, JsonNode answerValue,
                                        Integer version, Instant answeredAt) {
            return new AnswerSummary(questionKey, questionGroup, stepNumber,
                    answerValue != null ? answerValue.toString() : null,
                    version, answeredAt);
        }
    }
}
