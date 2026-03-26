package com.syncro.backend.domain.expats.service;

import com.syncro.backend.domain.expats.dto.AdminSessionResponse;
import com.syncro.backend.domain.expats.dto.AdminSessionResponse.AnswerSummary;
import com.syncro.backend.domain.expats.entity.ExpatsAnonymousAnswer;
import com.syncro.backend.domain.expats.entity.ExpatsAnonymousSession;
import com.syncro.backend.domain.expats.repository.ExpatsAnonymousAnswerRepository;
import com.syncro.backend.domain.expats.repository.ExpatsAnonymousSessionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

/**
 * Servizio admin per visibilita sulle sessioni anonime del funnel expats.
 * Permette di visualizzare sessioni, risposte, stato completamento e conversione.
 */
@Service
public class AdminSessionService {

    private final ExpatsAnonymousSessionRepository sessionRepository;
    private final ExpatsAnonymousAnswerRepository answerRepository;

    public AdminSessionService(ExpatsAnonymousSessionRepository sessionRepository,
                                ExpatsAnonymousAnswerRepository answerRepository) {
        this.sessionRepository = sessionRepository;
        this.answerRepository = answerRepository;
    }

    @Transactional(readOnly = true)
    public Page<AdminSessionResponse> listSessions(String status, Pageable pageable) {
        Page<ExpatsAnonymousSession> page;
        if (status != null && !status.isBlank()) {
            page = sessionRepository.findByStatusOrderByCreatedAtDesc(status.toUpperCase(), pageable);
        } else {
            page = sessionRepository.findAllByOrderByCreatedAtDesc(pageable);
        }
        return page.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public AdminSessionResponse getSession(UUID sessionId) {
        ExpatsAnonymousSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found: " + sessionId));
        return toResponse(session);
    }

    private AdminSessionResponse toResponse(ExpatsAnonymousSession session) {
        List<ExpatsAnonymousAnswer> answers = answerRepository.findBySessionIdOrderByStepNumberAsc(session.getId());

        String targetCity = extractAnswerValue(answers, "city_selection", "targetCityName");
        String currentCity = extractAnswerValue(answers, "city_selection", "currentCityName");

        List<AnswerSummary> answerSummaries = answers.stream()
                .map(a -> AnswerSummary.of(
                        a.getQuestionKey(),
                        a.getQuestionGroup(),
                        a.getStepNumber(),
                        a.getAnswerValue(),
                        a.getVersion(),
                        a.getAnsweredAt()
                ))
                .toList();

        return new AdminSessionResponse(
                session.getId(),
                session.getStatus(),
                session.getUserType(),
                session.getCurrentStep(),
                session.getTotalSteps(),
                targetCity,
                currentCity,
                session.getConvertedUser() != null,
                session.getConvertedUser() != null ? session.getConvertedUser().getId() : null,
                session.getConvertedUser() != null ? session.getConvertedUser().getEmail() : null,
                session.getConvertedAt(),
                session.getMetadata(),
                answerSummaries,
                session.getCreatedAt(),
                session.getUpdatedAt()
        );
    }

    /**
     * Estrae un valore da una risposta composita (es. city_selection contiene targetCityName e currentCityName).
     */
    private String extractAnswerValue(List<ExpatsAnonymousAnswer> answers, String questionKey, String field) {
        return answers.stream()
                .filter(a -> questionKey.equals(a.getQuestionKey()))
                .findFirst()
                .map(a -> {
                    Object val = a.getAnswerValue();
                    if (val instanceof java.util.Map<?, ?> map) {
                        Object v = map.get(field);
                        return v instanceof String s ? s : null;
                    }
                    if (val instanceof com.fasterxml.jackson.databind.JsonNode node && node.has(field)) {
                        return node.get(field).asText(null);
                    }
                    return null;
                })
                .orElse(null);
    }
}
