package com.syncro.backend.domain.analytics.service;

import com.syncro.backend.domain.analytics.entity.AnalyticsIngestionError;
import com.syncro.backend.domain.analytics.repository.AnalyticsIngestionErrorRepository;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Saves analytics ingestion errors in a new transaction so that when the main
 * transaction is aborted (e.g. duplicate key), error recording can still commit.
 */
@Component
public class AnalyticsIngestionErrorRecorder {

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
        AnalyticsIngestionError entity = new AnalyticsIngestionError();
        entity.setUserId(userId);
        entity.setIdempotencyKey(idempotencyKey == null || idempotencyKey.isBlank() ? null : idempotencyKey.trim());
        entity.setRawEvent(rawEvent != null ? rawEvent : Map.of());
        entity.setErrorCode(errorCode == null || errorCode.isBlank() ? "UNKNOWN" : errorCode);
        entity.setErrorMessage(errorMessage == null || errorMessage.isBlank() ? "Errore sconosciuto" : errorMessage);
        repository.save(entity);
    }
}
