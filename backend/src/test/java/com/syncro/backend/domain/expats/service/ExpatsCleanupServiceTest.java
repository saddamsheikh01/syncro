package com.syncro.backend.domain.expats.service;

import com.syncro.backend.domain.expats.repository.ExpatsAnonymousSessionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExpatsCleanupServiceTest {

    @Mock private ExpatsAnonymousSessionRepository sessionRepository;

    @InjectMocks
    private ExpatsCleanupService service;

    @Test
    @DisplayName("cleanupExpiredSessions expires sessions past their expiresAt")
    void cleanupExpiredSessions_expiresOldSessions() {
        when(sessionRepository.expireSessionsBefore(any(Instant.class), any(Instant.class)))
                .thenReturn(3);

        service.cleanupExpiredSessions();

        verify(sessionRepository).expireSessionsBefore(any(Instant.class), any(Instant.class));
    }

    @Test
    @DisplayName("cleanupExpiredSessions does nothing when no sessions are expired")
    void cleanupExpiredSessions_noExpired() {
        when(sessionRepository.expireSessionsBefore(any(Instant.class), any(Instant.class)))
                .thenReturn(0);

        service.cleanupExpiredSessions();

        verify(sessionRepository).expireSessionsBefore(any(Instant.class), any(Instant.class));
    }
}
