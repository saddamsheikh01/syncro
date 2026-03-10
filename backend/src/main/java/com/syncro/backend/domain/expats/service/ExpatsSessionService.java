package com.syncro.backend.domain.expats.service;

import com.syncro.backend.domain.expats.dto.*;
import com.syncro.backend.domain.expats.entity.ExpatsAnonymousAnswer;
import com.syncro.backend.domain.expats.entity.ExpatsAnonymousSession;
import com.syncro.backend.domain.expats.mapper.ExpatsMapper;
import com.syncro.backend.domain.expats.repository.ExpatsAnonymousAnswerRepository;
import com.syncro.backend.domain.expats.repository.ExpatsAnonymousSessionRepository;
import com.syncro.backend.domain.analytics.service.AnalyticsService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ExpatsSessionService {

    private static final Duration SESSION_TTL = Duration.ofHours(72);

    private final ExpatsAnonymousSessionRepository sessionRepository;
    private final ExpatsAnonymousAnswerRepository answerRepository;
    private final ExpatsMapper mapper;
    private final AnalyticsService analyticsService;

    public ExpatsSessionService(ExpatsAnonymousSessionRepository sessionRepository,
                                ExpatsAnonymousAnswerRepository answerRepository,
                                ExpatsMapper mapper,
                                AnalyticsService analyticsService) {
        this.sessionRepository = sessionRepository;
        this.answerRepository = answerRepository;
        this.mapper = mapper;
        this.analyticsService = analyticsService;
    }

    @Transactional
    public SessionResponse createSession(CreateSessionRequest request) {
        ExpatsAnonymousSession session = new ExpatsAnonymousSession();
        session.setSessionToken(UUID.randomUUID().toString());
        session.setExpiresAt(Instant.now().plus(SESSION_TTL));
        session.setMetadata(request != null ? request.metadata() : null);

        session = sessionRepository.save(session);

        analyticsService.trackServerEventSafe(null, "EXPATS_FUNNEL_STARTED",
                Map.of("sessionId", session.getId().toString()));

        return mapper.toSessionResponse(session, List.of());
    }

    @Transactional(readOnly = true)
    public SessionResponse getSession(UUID sessionId) {
        ExpatsAnonymousSession session = findSessionOrThrow(sessionId);
        List<ExpatsAnonymousAnswer> answers = answerRepository.findBySessionIdOrderByStepNumberAsc(sessionId);
        return mapper.toSessionResponse(session, answers);
    }

    @Transactional
    public SessionResponse updateSession(UUID sessionId, UpdateSessionRequest request) {
        final ExpatsAnonymousSession session = findSessionOrThrow(sessionId);

        if ("EXPIRED".equals(session.getStatus()) || "CONVERTED".equals(session.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Session is " + session.getStatus().toLowerCase() + " and cannot be updated");
        }

        // Upsert answer (handles back-navigation re-answers)
        ExpatsAnonymousAnswer answer = answerRepository
                .findBySessionIdAndQuestionKey(sessionId, request.questionKey())
                .orElseGet(() -> {
                    ExpatsAnonymousAnswer a = new ExpatsAnonymousAnswer();
                    a.setSession(session);
                    a.setQuestionKey(request.questionKey());
                    return a;
                });

        if (answer.getId() != null) {
            answer.setVersion(answer.getVersion() + 1);
        }

        answer.setStepNumber(request.stepNumber());
        answer.setQuestionGroup(request.questionGroup());
        answer.setAnswerValue(request.answerValue());
        answer.setAnsweredAt(Instant.now());
        answerRepository.save(answer);

        // Update session state
        session.setCurrentStep(request.stepNumber());
        session.setLastSeenAt(Instant.now());

        // Set user_type from step 1 answer
        if ("user_phase".equals(request.questionKey()) && request.answerValue() instanceof String value) {
            session.setUserType(value);
        }

        // Check completion
        int totalAnswers = answerRepository.countBySessionId(sessionId);
        if (totalAnswers >= session.getTotalSteps()) {
            session.setStatus("COMPLETED");
        }

        sessionRepository.save(session);

        analyticsService.trackServerEventSafe(null, "EXPATS_FUNNEL_STEP_COMPLETED",
                Map.of("sessionId", sessionId.toString(),
                        "step", request.stepNumber(),
                        "questionKey", request.questionKey()));

        List<ExpatsAnonymousAnswer> allAnswers = answerRepository.findBySessionIdOrderByStepNumberAsc(sessionId);
        return mapper.toSessionResponse(session, allAnswers);
    }

    private ExpatsAnonymousSession findSessionOrThrow(UUID sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));
    }

    public ExpatsAnonymousSession findByTokenOrThrow(String sessionToken) {
        return sessionRepository.findBySessionToken(sessionToken)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));
    }
}
