package com.syncro.backend.domain.relocation.entity;

import com.syncro.backend.domain.auth.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "relocation_city_scores")
public class RelocationCityScore {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "snapshot_id", nullable = false)
    private RelocationOnboardingSnapshot snapshot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "city_id")
    private RelocationCityDataset city;

    @Column(name = "analysis_type", nullable = false, length = 30)
    private String analysisType;

    @Column(name = "score_total", nullable = false)
    private Integer scoreTotal;

    @Column(name = "compatibility_level", nullable = false, length = 20)
    private String compatibilityLevel;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "breakdown", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> breakdown;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "user_weights", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> userWeights;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "user_priority_classification", columnDefinition = "jsonb")
    private Map<String, Object> userPriorityClassification;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "radar_values", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> radarValues;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "budget_check", columnDefinition = "jsonb")
    private Map<String, Object> budgetCheck;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "integration_breakdown", columnDefinition = "jsonb")
    private Map<String, Object> integrationBreakdown;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "insights", columnDefinition = "jsonb")
    private Map<String, Object> insights;

    @Column(name = "algorithm_version", nullable = false, length = 20)
    private String algorithmVersion;

    @Column(name = "ranking_position")
    private Integer rankingPosition;

    @Column(name = "computed_at", nullable = false)
    private Instant computedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (algorithmVersion == null) algorithmVersion = "1.0";
        if (computedAt == null) computedAt = Instant.now();
        createdAt = Instant.now();
    }

    // Getters and Setters

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public RelocationOnboardingSnapshot getSnapshot() { return snapshot; }
    public void setSnapshot(RelocationOnboardingSnapshot snapshot) { this.snapshot = snapshot; }

    public RelocationCityDataset getCity() { return city; }
    public void setCity(RelocationCityDataset city) { this.city = city; }

    public String getAnalysisType() { return analysisType; }
    public void setAnalysisType(String analysisType) { this.analysisType = analysisType; }

    public Integer getScoreTotal() { return scoreTotal; }
    public void setScoreTotal(Integer scoreTotal) { this.scoreTotal = scoreTotal; }

    public String getCompatibilityLevel() { return compatibilityLevel; }
    public void setCompatibilityLevel(String compatibilityLevel) { this.compatibilityLevel = compatibilityLevel; }

    public Map<String, Object> getBreakdown() { return breakdown; }
    public void setBreakdown(Map<String, Object> breakdown) { this.breakdown = breakdown; }

    public Map<String, Object> getUserWeights() { return userWeights; }
    public void setUserWeights(Map<String, Object> userWeights) { this.userWeights = userWeights; }

    public Map<String, Object> getUserPriorityClassification() { return userPriorityClassification; }
    public void setUserPriorityClassification(Map<String, Object> userPriorityClassification) { this.userPriorityClassification = userPriorityClassification; }

    public Map<String, Object> getRadarValues() { return radarValues; }
    public void setRadarValues(Map<String, Object> radarValues) { this.radarValues = radarValues; }

    public Map<String, Object> getBudgetCheck() { return budgetCheck; }
    public void setBudgetCheck(Map<String, Object> budgetCheck) { this.budgetCheck = budgetCheck; }

    public Map<String, Object> getIntegrationBreakdown() { return integrationBreakdown; }
    public void setIntegrationBreakdown(Map<String, Object> integrationBreakdown) { this.integrationBreakdown = integrationBreakdown; }

    public Map<String, Object> getInsights() { return insights; }
    public void setInsights(Map<String, Object> insights) { this.insights = insights; }

    public String getAlgorithmVersion() { return algorithmVersion; }
    public void setAlgorithmVersion(String algorithmVersion) { this.algorithmVersion = algorithmVersion; }

    public Integer getRankingPosition() { return rankingPosition; }
    public void setRankingPosition(Integer rankingPosition) { this.rankingPosition = rankingPosition; }

    public Instant getComputedAt() { return computedAt; }
    public void setComputedAt(Instant computedAt) { this.computedAt = computedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
