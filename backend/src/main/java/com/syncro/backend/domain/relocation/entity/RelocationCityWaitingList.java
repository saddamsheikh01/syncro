package com.syncro.backend.domain.relocation.entity;

import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.expats.entity.ExpatsAnonymousSession;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "relocation_city_waiting_list")
public class RelocationCityWaitingList {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "city_name", nullable = false, length = 255)
    private String cityName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private ExpatsAnonymousSession session;

    @Column(name = "notified", nullable = false)
    private Boolean notified;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (notified == null) notified = false;
        createdAt = Instant.now();
    }

    // Getters and Setters

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getCityName() { return cityName; }
    public void setCityName(String cityName) { this.cityName = cityName; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public ExpatsAnonymousSession getSession() { return session; }
    public void setSession(ExpatsAnonymousSession session) { this.session = session; }

    public Boolean getNotified() { return notified; }
    public void setNotified(Boolean notified) { this.notified = notified; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
