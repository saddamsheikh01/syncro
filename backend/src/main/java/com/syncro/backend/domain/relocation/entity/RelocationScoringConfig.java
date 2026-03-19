package com.syncro.backend.domain.relocation.entity;

import com.syncro.backend.domain.auth.entity.AdminUser;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "relocation_scoring_config")
public class RelocationScoringConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "config_key", nullable = false, unique = true, length = 100)
    private String configKey;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "thresholds", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> thresholds;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "budget_margin_thresholds", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> budgetMarginThresholds;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "budget_penalty_thresholds", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> budgetPenaltyThresholds;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "lifestyle_multipliers", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> lifestyleMultipliers;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "priority_thresholds", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> priorityThresholds;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "city_performance_thresholds", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> cityPerformanceThresholds;

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
        if (active == null) active = true;
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

    public Map<String, Object> getThresholds() { return thresholds; }
    public void setThresholds(Map<String, Object> thresholds) { this.thresholds = thresholds; }

    public Map<String, Object> getBudgetMarginThresholds() { return budgetMarginThresholds; }
    public void setBudgetMarginThresholds(Map<String, Object> budgetMarginThresholds) { this.budgetMarginThresholds = budgetMarginThresholds; }

    public Map<String, Object> getBudgetPenaltyThresholds() { return budgetPenaltyThresholds; }
    public void setBudgetPenaltyThresholds(Map<String, Object> budgetPenaltyThresholds) { this.budgetPenaltyThresholds = budgetPenaltyThresholds; }

    public Map<String, Object> getLifestyleMultipliers() { return lifestyleMultipliers; }
    public void setLifestyleMultipliers(Map<String, Object> lifestyleMultipliers) { this.lifestyleMultipliers = lifestyleMultipliers; }

    public Map<String, Object> getPriorityThresholds() { return priorityThresholds; }
    public void setPriorityThresholds(Map<String, Object> priorityThresholds) { this.priorityThresholds = priorityThresholds; }

    public Map<String, Object> getCityPerformanceThresholds() { return cityPerformanceThresholds; }
    public void setCityPerformanceThresholds(Map<String, Object> cityPerformanceThresholds) { this.cityPerformanceThresholds = cityPerformanceThresholds; }

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
