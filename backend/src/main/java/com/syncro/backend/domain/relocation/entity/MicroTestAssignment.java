package com.syncro.backend.domain.relocation.entity;

import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.tests.entity.TestDefinition;
import com.syncro.backend.domain.tests.entity.UserTestSubmission;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "micro_test_assignments")
public class MicroTestAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "test_id", nullable = false)
    private TestDefinition testDefinition;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "available_from", nullable = false)
    private Instant availableFrom;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id")
    private UserTestSubmission submission;

    @Column(name = "anti_repeat_window_days")
    private Integer antiRepeatWindowDays;

    @Column(name = "block_start_position", nullable = false)
    private Integer blockStartPosition;

    @Column(name = "block_size", nullable = false)
    private Integer blockSize;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (status == null) status = "PENDING";
        if (antiRepeatWindowDays == null) antiRepeatWindowDays = 30;
        if (blockStartPosition == null) blockStartPosition = 0;
        if (blockSize == null) blockSize = 3;
        if (availableFrom == null) availableFrom = Instant.now();
        createdAt = Instant.now();
    }

    // Getters and Setters

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public TestDefinition getTestDefinition() { return testDefinition; }
    public void setTestDefinition(TestDefinition testDefinition) { this.testDefinition = testDefinition; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getAvailableFrom() { return availableFrom; }
    public void setAvailableFrom(Instant availableFrom) { this.availableFrom = availableFrom; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public UserTestSubmission getSubmission() { return submission; }
    public void setSubmission(UserTestSubmission submission) { this.submission = submission; }

    public Integer getAntiRepeatWindowDays() { return antiRepeatWindowDays; }
    public void setAntiRepeatWindowDays(Integer antiRepeatWindowDays) { this.antiRepeatWindowDays = antiRepeatWindowDays; }

    public Integer getBlockStartPosition() { return blockStartPosition; }
    public void setBlockStartPosition(Integer blockStartPosition) { this.blockStartPosition = blockStartPosition; }

    public Integer getBlockSize() { return blockSize; }
    public void setBlockSize(Integer blockSize) { this.blockSize = blockSize; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
