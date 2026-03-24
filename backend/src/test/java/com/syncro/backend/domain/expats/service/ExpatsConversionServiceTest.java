package com.syncro.backend.domain.expats.service;

import com.syncro.backend.domain.analytics.service.AnalyticsService;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.expats.entity.ExpatsAnonymousAnswer;
import com.syncro.backend.domain.expats.entity.ExpatsAnonymousSession;
import com.syncro.backend.domain.expats.repository.ExpatsAnonymousAnswerRepository;
import com.syncro.backend.domain.expats.repository.ExpatsAnonymousSessionRepository;
import com.syncro.backend.domain.relocation.repository.RelocationProfileRepository;
import com.syncro.backend.domain.relocation.service.ExpatsFunnelToRelocationProfileMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExpatsConversionServiceTest {

    @Mock private ExpatsAnonymousSessionRepository sessionRepository;
    @Mock private ExpatsAnonymousAnswerRepository answerRepository;
    @Mock private UserRepository userRepository;
    @Mock private AnalyticsService analyticsService;
    @Mock private RelocationProfileRepository relocationProfileRepository;
    @Mock private ExpatsFunnelToRelocationProfileMapper funnelToRelocationProfileMapper;

    @InjectMocks
    private ExpatsConversionService service;

    private User testUser;
    private ExpatsAnonymousSession testSession;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());

        testSession = new ExpatsAnonymousSession();
        testSession.setId(UUID.randomUUID());
        testSession.setSessionToken("test-token-123");
        testSession.setStatus("IN_PROGRESS");
        testSession.setCurrentStep(5);
        testSession.setTotalSteps(10);
        testSession.setExpiresAt(Instant.now().plusSeconds(86400));
    }

    @Test
    @DisplayName("convertSession converts session, syncs relocation profile and tracks analytics")
    void convertSession_success() {
        ExpatsAnonymousAnswer answer = new ExpatsAnonymousAnswer();
        answer.setSession(testSession);
        answer.setQuestionKey("city_selection");
        answer.setAnswerValue(
                java.util.Map.of(
                        "targetCityId", UUID.randomUUID().toString(),
                        "targetCityName", "Lisbon"
                )
        );

        when(sessionRepository.findBySessionToken("test-token-123"))
                .thenReturn(Optional.of(testSession));
        when(userRepository.getReferenceById(testUser.getId())).thenReturn(testUser);
        when(sessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(answerRepository.findBySessionIdOrderByStepNumberAsc(testSession.getId()))
                .thenReturn(List.of(answer));
        when(relocationProfileRepository.findByUserId(testUser.getId())).thenReturn(Optional.empty());
        when(relocationProfileRepository.findByAnonymousSession_Id(testSession.getId())).thenReturn(Optional.empty());
        when(relocationProfileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.convertSession("test-token-123", testUser.getId());

        verify(sessionRepository).save(argThat(session ->
                "CONVERTED".equals(session.getStatus()) &&
                session.getConvertedUser().equals(testUser) &&
                session.getConvertedAt() != null
        ));
        verify(funnelToRelocationProfileMapper).applyAnswers(any(), eq(List.of(answer)));
        verify(relocationProfileRepository).save(argThat(profile ->
                profile.getUser().equals(testUser) &&
                profile.getConvertedFromSession().equals(testSession) &&
                profile.getAnonymousSession() == null
        ));

        verify(analyticsService).trackServerEventSafe(
                eq(testUser.getId()), eq("EXPATS_ANON_CONVERTED"), anyMap()
        );
    }

    @Test
    @DisplayName("convertSession is idempotent for same user")
    void convertSession_alreadyConvertedSameUser_returnsQuietly() {
        testSession.setStatus("CONVERTED");
        testSession.setConvertedUser(testUser);

        when(sessionRepository.findBySessionToken("test-token-123"))
                .thenReturn(Optional.of(testSession));

        service.convertSession("test-token-123", testUser.getId());

        verify(sessionRepository, never()).save(any());
        verify(relocationProfileRepository, never()).save(any());
        verify(funnelToRelocationProfileMapper, never()).applyAnswers(any(), anyList());
        verify(analyticsService, never()).trackServerEventSafe(any(), any(), any());
    }

    @Test
    @DisplayName("convertSession throws NOT_FOUND when session doesn't exist")
    void convertSession_sessionNotFound_throwsNotFound() {
        when(sessionRepository.findBySessionToken("nonexistent"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.convertSession("nonexistent", testUser.getId()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Session not found");
    }

    @Test
    @DisplayName("convertSession throws CONFLICT when session is expired")
    void convertSession_expiredSession_throwsConflict() {
        testSession.setStatus("EXPIRED");

        when(sessionRepository.findBySessionToken("test-token-123"))
                .thenReturn(Optional.of(testSession));

        assertThatThrownBy(() -> service.convertSession("test-token-123", testUser.getId()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Session has expired");
    }

    @Test
    @DisplayName("convertSession throws CONFLICT when already converted to different user")
    void convertSession_alreadyConvertedDifferentUser_throwsConflict() {
        User otherUser = new User();
        otherUser.setId(UUID.randomUUID());

        testSession.setStatus("CONVERTED");
        testSession.setConvertedUser(otherUser);

        when(sessionRepository.findBySessionToken("test-token-123"))
                .thenReturn(Optional.of(testSession));

        assertThatThrownBy(() -> service.convertSession("test-token-123", testUser.getId()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Session already converted to another user");
    }
}
