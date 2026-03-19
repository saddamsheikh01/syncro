package com.syncro.backend.domain.analytics.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "analytics_ingestion_errors")
public class AnalyticsIngestionError {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "idempotency_key", columnDefinition = "text")
    private String idempotencyKey;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_event", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> rawEvent;

    @Column(name = "error_code", nullable = false, columnDefinition = "text")
    private String errorCode;

    @Column(name = "error_message", nullable = false, columnDefinition = "text")
    private String errorMessage;

    @PrePersist
    void onCreate() {
        if (occurredAt == null) {
            occurredAt = Instant.now();
        }
        if (rawEvent == null) {
            rawEvent = new HashMap<>();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }

    public void setOccurredAt(Instant occurredAt) {
        this.occurredAt = occurredAt;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public Map<String, Object> getRawEvent() {
        return rawEvent;
    }

    public void setRawEvent(Map<String, Object> rawEvent) {
        this.rawEvent = rawEvent;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
}
