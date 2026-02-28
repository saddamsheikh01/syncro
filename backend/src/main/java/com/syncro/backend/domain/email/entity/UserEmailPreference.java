package com.syncro.backend.domain.email.entity;

import com.syncro.backend.domain.auth.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_email_preferences")
public class UserEmailPreference {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "chat_enabled", nullable = false)
    private boolean chatEnabled = true;

    @Column(name = "connections_enabled", nullable = false)
    private boolean connectionsEnabled = true;

    @Column(name = "match_enabled", nullable = false)
    private boolean matchEnabled = true;

    @Column(name = "events_enabled", nullable = false)
    private boolean eventsEnabled = true;

    @Column(name = "digest_enabled", nullable = false)
    private boolean digestEnabled = true;

    @Column(name = "content_weekly_digest", nullable = false)
    private boolean contentWeeklyDigest = true;

    @Column(name = "chat_min_minutes_between", nullable = false)
    private int chatMinMinutesBetween = 15;

    @Column(name = "security_enabled", nullable = false)
    private boolean securityEnabled = true;

    @Column(name = "tests_profile_enabled", nullable = false)
    private boolean testsProfileEnabled = true;

    @Column(name = "feed_moments_enabled", nullable = false)
    private boolean feedMomentsEnabled = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; this.userId = user != null ? user.getId() : null; }
    public boolean isChatEnabled() { return chatEnabled; }
    public void setChatEnabled(boolean chatEnabled) { this.chatEnabled = chatEnabled; }
    public boolean isConnectionsEnabled() { return connectionsEnabled; }
    public void setConnectionsEnabled(boolean connectionsEnabled) { this.connectionsEnabled = connectionsEnabled; }
    public boolean isMatchEnabled() { return matchEnabled; }
    public void setMatchEnabled(boolean matchEnabled) { this.matchEnabled = matchEnabled; }
    public boolean isEventsEnabled() { return eventsEnabled; }
    public void setEventsEnabled(boolean eventsEnabled) { this.eventsEnabled = eventsEnabled; }
    public boolean isDigestEnabled() { return digestEnabled; }
    public void setDigestEnabled(boolean digestEnabled) { this.digestEnabled = digestEnabled; }
    public boolean isContentWeeklyDigest() { return contentWeeklyDigest; }
    public void setContentWeeklyDigest(boolean contentWeeklyDigest) { this.contentWeeklyDigest = contentWeeklyDigest; }
    public int getChatMinMinutesBetween() { return chatMinMinutesBetween; }
    public void setChatMinMinutesBetween(int chatMinMinutesBetween) { this.chatMinMinutesBetween = chatMinMinutesBetween; }
    public boolean isSecurityEnabled() { return securityEnabled; }
    public void setSecurityEnabled(boolean securityEnabled) { this.securityEnabled = securityEnabled; }
    public boolean isTestsProfileEnabled() { return testsProfileEnabled; }
    public void setTestsProfileEnabled(boolean testsProfileEnabled) { this.testsProfileEnabled = testsProfileEnabled; }
    public boolean isFeedMomentsEnabled() { return feedMomentsEnabled; }
    public void setFeedMomentsEnabled(boolean feedMomentsEnabled) { this.feedMomentsEnabled = feedMomentsEnabled; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
