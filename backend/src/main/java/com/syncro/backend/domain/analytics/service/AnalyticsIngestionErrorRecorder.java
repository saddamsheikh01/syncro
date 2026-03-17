package com.syncro.backend.domain.analytics.service;

import com.syncro.backend.domain.analytics.entity.AnalyticsIngestionError;
import com.syncro.backend.domain.analytics.repository.AnalyticsIngestionErrorRepository;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Saves analytics ingestion errors in a new transaction so that when the main
 * transaction is aborted (e.g. duplicate key), error recording can still commit.
 */
@Component
public class AnalyticsIngestionErrorRecorder {

    private static final Logger logger = LoggerFactory.getLogger(AnalyticsIngestionErrorRecorder.class);
    private static final int MAX_TEXT_LENGTH = 4000;

    private final AnalyticsIngestionErrorRepository repository;

    public AnalyticsIngestionErrorRecorder(AnalyticsIngestionErrorRepository repository) {
        this.repository = repository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(
        UUID userId,
        String idempotencyKey,
        Map<String, Object> rawEvent,
        String errorCode,
        String errorMessage
    ) {
        try {
            AnalyticsIngestionError entity = new AnalyticsIngestionError();
            entity.setUserId(userId);
            entity.setIdempotencyKey(truncate(idempotencyKey == null || idempotencyKey.isBlank() ? null : idempotencyKey.trim()));
            entity.setRawEvent(rawEvent != null ? rawEvent : Map.of());
            entity.setErrorCode(truncate(errorCode == null || errorCode.isBlank() ? "UNKNOWN" : errorCode));
            entity.setErrorMessage(truncate(errorMessage == null || errorMessage.isBlank() ? "Unknown error" : errorMessage));
            repository.save(entity);
        } catch (Exception e) {
            logger.error("Failed to persist analytics ingestion error row: {}", e.getMessage());
        }
    }

    private static String truncate(String value) {
        if (value == null || value.length() <= MAX_TEXT_LENGTH) {
            return value;
        }
        return value.substring(0, MAX_TEXT_LENGTH - 3) + "...";
    }
}
