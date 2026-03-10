package com.syncro.backend.domain.relocation.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "relocation_weight_rules", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"question_key", "answer_value"})
})
public class RelocationWeightRule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "question_key", nullable = false, length = 50)
    private String questionKey;

    @Column(name = "answer_value", nullable = false, length = 50)
    private String answerValue;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "weight_adjustments", nullable = false, columnDefinition = "jsonb")
    private Map<String, Integer> weightAdjustments;

    @Column(name = "active", nullable = false)
    private Boolean active;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

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

    public String getQuestionKey() { return questionKey; }
    public void setQuestionKey(String questionKey) { this.questionKey = questionKey; }

    public String getAnswerValue() { return answerValue; }
    public void setAnswerValue(String answerValue) { this.answerValue = answerValue; }

    public Map<String, Integer> getWeightAdjustments() { return weightAdjustments; }
    public void setWeightAdjustments(Map<String, Integer> weightAdjustments) { this.weightAdjustments = weightAdjustments; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
