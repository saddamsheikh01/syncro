package com.syncro.backend.domain.expats.service;

import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.expats.entity.ExpatsAnonymousAnswer;
import com.syncro.backend.domain.expats.entity.ExpatsAnonymousSession;
import com.syncro.backend.domain.expats.repository.ExpatsAnonymousAnswerRepository;
import com.syncro.backend.domain.expats.repository.ExpatsAnonymousSessionRepository;
import com.syncro.backend.domain.analytics.service.AnalyticsService;
import com.syncro.backend.domain.relocation.entity.RelocationProfile;
import com.syncro.backend.domain.relocation.repository.RelocationProfileRepository;
import com.syncro.backend.domain.relocation.service.ExpatsFunnelToRelocationProfileMapper;
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
    private final RelocationProfileRepository relocationProfileRepository;
    private final ExpatsFunnelToRelocationProfileMapper funnelToRelocationProfileMapper;

    public ExpatsConversionService(ExpatsAnonymousSessionRepository sessionRepository,
                                   ExpatsAnonymousAnswerRepository answerRepository,
                                   UserRepository userRepository,
                                   AnalyticsService analyticsService,
                                   RelocationProfileRepository relocationProfileRepository,
                                   ExpatsFunnelToRelocationProfileMapper funnelToRelocationProfileMapper) {
        this.sessionRepository = sessionRepository;
        this.answerRepository = answerRepository;
        this.userRepository = userRepository;
        this.analyticsService = analyticsService;
        this.relocationProfileRepository = relocationProfileRepository;
        this.funnelToRelocationProfileMapper = funnelToRelocationProfileMapper;
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

        List<ExpatsAnonymousAnswer> answers = answerRepository.findBySessionIdOrderByStepNumberAsc(session.getId());
        syncRelocationProfile(session, userId, answers);

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

    private void syncRelocationProfile(ExpatsAnonymousSession session,
                                       UUID userId,
                                       List<ExpatsAnonymousAnswer> answers) {
        RelocationProfile profile = relocationProfileRepository.findByUserId(userId)
                .orElseGet(() -> relocationProfileRepository.findByAnonymousSession_Id(session.getId())
                        .orElseGet(RelocationProfile::new));

        profile.setUser(userRepository.getReferenceById(userId));
        profile.setAnonymousSession(null);
        profile.setConvertedFromSession(session);

        funnelToRelocationProfileMapper.applyAnswers(profile, answers);
        relocationProfileRepository.save(profile);
    }
}
