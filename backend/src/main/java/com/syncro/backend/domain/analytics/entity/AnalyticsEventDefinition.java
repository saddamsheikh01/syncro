package com.syncro.backend.domain.analytics.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "analytics_event_definitions")
@IdClass(AnalyticsEventDefinitionId.class)
public class AnalyticsEventDefinition {

    @Id
    @Column(name = "event_name", nullable = false)
    private String eventName;

    @Id
    @Column(name = "event_version", nullable = false)
    private Integer eventVersion;

    @Column(name = "description", nullable = false)
    private String description;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "payload_required_keys", nullable = false, columnDefinition = "text[]")
    private String[] payloadRequiredKeys;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (eventVersion == null) {
            eventVersion = 1;
        }
        if (payloadRequiredKeys == null) {
            payloadRequiredKeys = new String[0];
        }
        if (isActive == null) {
            isActive = Boolean.TRUE;
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public String getEventName() {
        return eventName;
    }

    public void setEventName(String eventName) {
        this.eventName = eventName;
    }

    public Integer getEventVersion() {
        return eventVersion;
    }

    public void setEventVersion(Integer eventVersion) {
        this.eventVersion = eventVersion;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String[] getPayloadRequiredKeys() {
        return payloadRequiredKeys;
    }

    public void setPayloadRequiredKeys(String[] payloadRequiredKeys) {
        this.payloadRequiredKeys = payloadRequiredKeys;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
