package com.syncro.backend.domain.relocation.entity;

import com.syncro.backend.domain.auth.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "relocation_onboarding_snapshots", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "version"})
})
public class RelocationOnboardingSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "relocation_profile_id", nullable = false)
    private RelocationProfile relocationProfile;

    @Column(name = "version", nullable = false)
    private Integer version;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> payload;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (version == null) version = 1;
        if (isActive == null) isActive = true;
        createdAt = Instant.now();
    }

    // Getters and Setters

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public RelocationProfile getRelocationProfile() { return relocationProfile; }
    public void setRelocationProfile(RelocationProfile relocationProfile) { this.relocationProfile = relocationProfile; }

    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }

    public Map<String, Object> getPayload() { return payload; }
    public void setPayload(Map<String, Object> payload) { this.payload = payload; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
