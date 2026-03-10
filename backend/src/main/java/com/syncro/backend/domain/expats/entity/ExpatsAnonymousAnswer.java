package com.syncro.backend.domain.expats.entity;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "expats_anonymous_answers", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"session_id", "question_key"})
})
public class ExpatsAnonymousAnswer {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private ExpatsAnonymousSession session;

    @Column(name = "step_number", nullable = false)
    private Integer stepNumber;

    @Column(name = "question_group", nullable = false, length = 30)
    private String questionGroup;

    @Column(name = "question_key", nullable = false, length = 50)
    private String questionKey;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "answer_value", nullable = false, columnDefinition = "jsonb")
    private JsonNode answerValue;

    @Column(name = "answered_at", nullable = false)
    private Instant answeredAt;

    @Column(name = "version", nullable = false)
    private Integer version;

    @PrePersist
    void onCreate() {
        if (version == null) version = 1;
        if (answeredAt == null) answeredAt = Instant.now();
    }

    // Getters and Setters

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public ExpatsAnonymousSession getSession() { return session; }
    public void setSession(ExpatsAnonymousSession session) { this.session = session; }

    public Integer getStepNumber() { return stepNumber; }
    public void setStepNumber(Integer stepNumber) { this.stepNumber = stepNumber; }

    public String getQuestionGroup() { return questionGroup; }
    public void setQuestionGroup(String questionGroup) { this.questionGroup = questionGroup; }

    public String getQuestionKey() { return questionKey; }
    public void setQuestionKey(String questionKey) { this.questionKey = questionKey; }

    public JsonNode getAnswerValue() { return answerValue; }
    /**
     * Accepts any value (String, Map, List, Number, Boolean, JsonNode)
     * and converts it to JsonNode for proper JSONB serialization.
     */
    public void setAnswerValue(Object answerValue) {
        if (answerValue instanceof JsonNode jn) {
            this.answerValue = jn;
        } else {
            this.answerValue = MAPPER.valueToTree(answerValue);
        }
    }

    public Instant getAnsweredAt() { return answeredAt; }
    public void setAnsweredAt(Instant answeredAt) { this.answeredAt = answeredAt; }

    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
}
