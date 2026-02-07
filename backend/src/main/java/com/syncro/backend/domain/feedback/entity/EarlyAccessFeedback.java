package com.syncro.backend.domain.feedback.entity;

import com.syncro.backend.domain.auth.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "early_access_feedback")
public class EarlyAccessFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, insertable = false, updatable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false)
    private EarlyAccessFeedbackSource source;

    @Enumerated(EnumType.STRING)
    @Column(name = "choice", nullable = false)
    private EarlyAccessFeedbackChoice choice;

    @Column(name = "message")
    private String message;

    @Column(name = "active_seconds_before_prompt")
    private Integer activeSecondsBeforePrompt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
        this.userId = user != null ? user.getId() : null;
    }

    public EarlyAccessFeedbackSource getSource() {
        return source;
    }

    public void setSource(EarlyAccessFeedbackSource source) {
        this.source = source;
    }

    public EarlyAccessFeedbackChoice getChoice() {
        return choice;
    }

    public void setChoice(EarlyAccessFeedbackChoice choice) {
        this.choice = choice;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Integer getActiveSecondsBeforePrompt() {
        return activeSecondsBeforePrompt;
    }

    public void setActiveSecondsBeforePrompt(Integer activeSecondsBeforePrompt) {
        this.activeSecondsBeforePrompt = activeSecondsBeforePrompt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
