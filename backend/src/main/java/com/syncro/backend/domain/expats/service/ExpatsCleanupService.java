package com.syncro.backend.domain.expats.service;

import com.syncro.backend.domain.expats.repository.ExpatsAnonymousSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class ExpatsCleanupService {

    private static final Logger log = LoggerFactory.getLogger(ExpatsCleanupService.class);

    private final ExpatsAnonymousSessionRepository sessionRepository;

    public ExpatsCleanupService(ExpatsAnonymousSessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    /**
     * Expires anonymous sessions that have passed their expires_at.
     * Runs every 6 hours.
     */
    @Scheduled(fixedRate = 6 * 60 * 60 * 1000)
    @Transactional
    public void cleanupExpiredSessions() {
        Instant now = Instant.now();
        int expired = sessionRepository.expireSessionsBefore(now, now);
        if (expired > 0) {
            log.info("Expired {} anonymous funnel sessions", expired);
        }
    }
}
