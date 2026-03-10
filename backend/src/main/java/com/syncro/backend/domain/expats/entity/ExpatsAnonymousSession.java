package com.syncro.backend.domain.expats.entity;

import com.syncro.backend.domain.auth.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "expats_anonymous_sessions")
public class ExpatsAnonymousSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "session_token", nullable = false, unique = true, length = 255)
    private String sessionToken;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "current_step", nullable = false)
    private Integer currentStep;

    @Column(name = "total_steps", nullable = false)
    private Integer totalSteps;

    @Column(name = "user_type", length = 30)
    private String userType;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "last_seen_at", nullable = false)
    private Instant lastSeenAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "converted_user_id")
    private User convertedUser;

    @Column(name = "converted_at")
    private Instant convertedAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (status == null) status = "IN_PROGRESS";
        if (currentStep == null) currentStep = 1;
        if (totalSteps == null) totalSteps = 10;
        if (lastSeenAt == null) lastSeenAt = now;
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    // Getters and Setters

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getSessionToken() { return sessionToken; }
    public void setSessionToken(String sessionToken) { this.sessionToken = sessionToken; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getCurrentStep() { return currentStep; }
    public void setCurrentStep(Integer currentStep) { this.currentStep = currentStep; }

    public Integer getTotalSteps() { return totalSteps; }
    public void setTotalSteps(Integer totalSteps) { this.totalSteps = totalSteps; }

    public String getUserType() { return userType; }
    public void setUserType(String userType) { this.userType = userType; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }

    public Instant getLastSeenAt() { return lastSeenAt; }
    public void setLastSeenAt(Instant lastSeenAt) { this.lastSeenAt = lastSeenAt; }

    public User getConvertedUser() { return convertedUser; }
    public void setConvertedUser(User convertedUser) { this.convertedUser = convertedUser; }

    public Instant getConvertedAt() { return convertedAt; }
    public void setConvertedAt(Instant convertedAt) { this.convertedAt = convertedAt; }

    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
