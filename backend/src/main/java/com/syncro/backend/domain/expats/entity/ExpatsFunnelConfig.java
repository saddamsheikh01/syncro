package com.syncro.backend.domain.expats.entity;

import com.syncro.backend.domain.auth.entity.AdminUser;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "expats_funnel_configs", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"config_key", "language", "version"})
})
public class ExpatsFunnelConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "config_key", nullable = false, length = 100)
    private String configKey;

    @Column(name = "language", nullable = false, length = 10)
    private String language;

    @Column(name = "version", nullable = false)
    private Integer version;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "content", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> content;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "feature_flags", columnDefinition = "jsonb")
    private Map<String, Object> featureFlags;

    @Column(name = "active", nullable = false)
    private Boolean active;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private AdminUser createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private AdminUser updatedBy;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (language == null) language = "en";
        if (version == null) version = 1;
        if (active == null) active = false;
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

    public String getConfigKey() { return configKey; }
    public void setConfigKey(String configKey) { this.configKey = configKey; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }

    public Map<String, Object> getContent() { return content; }
    public void setContent(Map<String, Object> content) { this.content = content; }

    public Map<String, Object> getFeatureFlags() { return featureFlags; }
    public void setFeatureFlags(Map<String, Object> featureFlags) { this.featureFlags = featureFlags; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public AdminUser getCreatedBy() { return createdBy; }
    public void setCreatedBy(AdminUser createdBy) { this.createdBy = createdBy; }

    public AdminUser getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(AdminUser updatedBy) { this.updatedBy = updatedBy; }
}
