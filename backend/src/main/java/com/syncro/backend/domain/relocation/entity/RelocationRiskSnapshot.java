package com.syncro.backend.domain.relocation.entity;

import com.syncro.backend.domain.auth.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "relocation_risk_snapshots")
public class RelocationRiskSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "scenario", length = 30)
    private String scenario;

    @Column(name = "source_type", length = 50)
    private String sourceType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "risk_indicators", columnDefinition = "jsonb")
    private Map<String, Object> riskIndicators;

    @Column(name = "burnout_index")
    private Integer burnoutIndex;

    @Column(name = "overall_risk_level", length = 20)
    private String overallRiskLevel;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    // Getters and Setters

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getScenario() { return scenario; }
    public void setScenario(String scenario) { this.scenario = scenario; }

    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }

    public Map<String, Object> getRiskIndicators() { return riskIndicators; }
    public void setRiskIndicators(Map<String, Object> riskIndicators) { this.riskIndicators = riskIndicators; }

    public Integer getBurnoutIndex() { return burnoutIndex; }
    public void setBurnoutIndex(Integer burnoutIndex) { this.burnoutIndex = burnoutIndex; }

    public String getOverallRiskLevel() { return overallRiskLevel; }
    public void setOverallRiskLevel(String overallRiskLevel) { this.overallRiskLevel = overallRiskLevel; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
