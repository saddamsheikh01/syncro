package com.syncro.backend.domain.zyra.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "profile_recap_pending_refresh")
public class ProfileRecapPendingRefresh {

    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "pending_refresh", nullable = false)
    private boolean pendingRefresh = true;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void onSave() {
        updatedAt = Instant.now();
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public boolean isPendingRefresh() {
        return pendingRefresh;
    }

    public void setPendingRefresh(boolean pendingRefresh) {
        this.pendingRefresh = pendingRefresh;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
