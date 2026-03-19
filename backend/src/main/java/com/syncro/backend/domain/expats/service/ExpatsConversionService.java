package com.syncro.backend.domain.expats.service;

import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.expats.entity.ExpatsAnonymousAnswer;
import com.syncro.backend.domain.expats.entity.ExpatsAnonymousSession;
import com.syncro.backend.domain.expats.repository.ExpatsAnonymousAnswerRepository;
import com.syncro.backend.domain.expats.repository.ExpatsAnonymousSessionRepository;
import com.syncro.backend.domain.analytics.service.AnalyticsService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ExpatsConversionService {

    private final ExpatsAnonymousSessionRepository sessionRepository;
    private final ExpatsAnonymousAnswerRepository answerRepository;
    private final UserRepository userRepository;
    private final AnalyticsService analyticsService;

    public ExpatsConversionService(ExpatsAnonymousSessionRepository sessionRepository,
                                   ExpatsAnonymousAnswerRepository answerRepository,
                                   UserRepository userRepository,
                                   AnalyticsService analyticsService) {
        this.sessionRepository = sessionRepository;
        this.answerRepository = answerRepository;
        this.userRepository = userRepository;
        this.analyticsService = analyticsService;
    }

    /**
     * Converts an anonymous session to a registered user.
     * Called after the user has completed registration/login via AuthService.
     * Atomic and idempotent: if already converted, returns silently.
     */
    @Transactional
    public void convertSession(String sessionToken, UUID userId) {
        ExpatsAnonymousSession session = sessionRepository.findBySessionToken(sessionToken)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));

        if ("CONVERTED".equals(session.getStatus())) {
            if (session.getConvertedUser() != null && session.getConvertedUser().getId().equals(userId)) {
                return;
            }
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Session already converted to another user");
        }

        if ("EXPIRED".equals(session.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Session has expired");
        }

        session.setStatus("CONVERTED");
        session.setConvertedUser(userRepository.getReferenceById(userId));
        session.setConvertedAt(Instant.now());
        session.setLastSeenAt(Instant.now());
        sessionRepository.save(session);

        analyticsService.trackServerEventSafe(userId, "EXPATS_ANON_CONVERTED",
                Map.of("sessionId", session.getId().toString()));
    }

    /**
     * Returns the answers from a converted session for populating the relocation profile.
     */
    @Transactional(readOnly = true)
    public List<ExpatsAnonymousAnswer> getSessionAnswers(UUID sessionId) {
        return answerRepository.findBySessionIdOrderByStepNumberAsc(sessionId);
    }
}
