package com.syncro.backend.domain.expats.service;

import com.syncro.backend.domain.analytics.service.AnalyticsService;
import com.syncro.backend.domain.expats.dto.CreateSessionRequest;
import com.syncro.backend.domain.expats.dto.SessionResponse;
import com.syncro.backend.domain.expats.dto.UpdateSessionRequest;
import com.syncro.backend.domain.expats.entity.ExpatsAnonymousAnswer;
import com.syncro.backend.domain.expats.entity.ExpatsAnonymousSession;
import com.syncro.backend.domain.expats.mapper.ExpatsMapper;
import com.syncro.backend.domain.expats.repository.ExpatsAnonymousAnswerRepository;
import com.syncro.backend.domain.expats.repository.ExpatsAnonymousSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExpatsSessionServiceTest {

    @Mock
    private ExpatsAnonymousSessionRepository sessionRepository;

    @Mock
    private ExpatsAnonymousAnswerRepository answerRepository;

    @Mock
    private ExpatsMapper mapper;

    @Mock
    private AnalyticsService analyticsService;

    @InjectMocks
    private ExpatsSessionService service;

    private ExpatsAnonymousSession testSession;

    @BeforeEach
    void setUp() {
        testSession = new ExpatsAnonymousSession();
        testSession.setId(UUID.randomUUID());
        testSession.setSessionToken(UUID.randomUUID().toString());
        testSession.setStatus("IN_PROGRESS");
        testSession.setCurrentStep(0);
        testSession.setTotalSteps(10);
        testSession.setExpiresAt(Instant.now().plusSeconds(259200));
    }

    @Test
    @DisplayName("createSession returns a new session with token and IN_PROGRESS status")
    void createSession_returnsNewSession() {
        SessionResponse expectedResponse = new SessionResponse(
                testSession.getId(), testSession.getSessionToken(), "IN_PROGRESS",
                0, 10, null, testSession.getExpiresAt(), null, List.of()
        );

        when(sessionRepository.save(any(ExpatsAnonymousSession.class))).thenReturn(testSession);
        when(mapper.toSessionResponse(any(), anyList())).thenReturn(expectedResponse);

        SessionResponse result = service.createSession(null);

        assertThat(result).isNotNull();
        assertThat(result.status()).isEqualTo("IN_PROGRESS");
        verify(sessionRepository).save(any(ExpatsAnonymousSession.class));
        verify(analyticsService).trackServerEventSafe(isNull(), eq("EXPATS_FUNNEL_STARTED"), anyMap());
    }

    @Test
    @DisplayName("getSession returns session with answers")
    void getSession_returnsSessionWithAnswers() {
        UUID sessionId = testSession.getId();
        SessionResponse expectedResponse = new SessionResponse(
                sessionId, testSession.getSessionToken(), "IN_PROGRESS",
                0, 10, null, testSession.getExpiresAt(), null, List.of()
        );

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(testSession));
        when(answerRepository.findBySessionIdOrderByStepNumberAsc(sessionId)).thenReturn(List.of());
        when(mapper.toSessionResponse(testSession, List.of())).thenReturn(expectedResponse);

        SessionResponse result = service.getSession(sessionId);

        assertThat(result).isNotNull();
        assertThat(result.id()).isEqualTo(sessionId);
    }

    @Test
    @DisplayName("getSession throws NOT_FOUND for non-existent session")
    void getSession_throwsNotFound() {
        UUID sessionId = UUID.randomUUID();
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getSession(sessionId))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Session not found");
    }

    @Test
    @DisplayName("updateSession on EXPIRED session throws CONFLICT")
    void updateSession_expiredSessionThrowsConflict() {
        UUID sessionId = testSession.getId();
        testSession.setStatus("EXPIRED");

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(testSession));

        UpdateSessionRequest request = new UpdateSessionRequest(1, "city_fit", "user_phase", "planning_move");

        assertThatThrownBy(() -> service.updateSession(sessionId, request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("expired");
    }

    @Test
    @DisplayName("updateSession upserts answer and advances step")
    void updateSession_upsertsAnswer() {
        UUID sessionId = testSession.getId();

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(testSession));
        when(answerRepository.findBySessionIdAndQuestionKey(sessionId, "user_phase")).thenReturn(Optional.empty());
        when(answerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(answerRepository.countBySessionId(sessionId)).thenReturn(1);
        when(sessionRepository.save(any())).thenReturn(testSession);
        when(answerRepository.findBySessionIdOrderByStepNumberAsc(sessionId)).thenReturn(List.of());
        when(mapper.toSessionResponse(any(), anyList())).thenReturn(
                new SessionResponse(sessionId, "token", "IN_PROGRESS", 1, 10, "planning_move",
                        Instant.now(), Instant.now(), List.of())
        );

        UpdateSessionRequest request = new UpdateSessionRequest(1, "city_fit", "user_phase", "planning_move");
        SessionResponse result = service.updateSession(sessionId, request);

        assertThat(result).isNotNull();
        verify(answerRepository).save(any(ExpatsAnonymousAnswer.class));
        verify(sessionRepository).save(any(ExpatsAnonymousSession.class));
    }
}
