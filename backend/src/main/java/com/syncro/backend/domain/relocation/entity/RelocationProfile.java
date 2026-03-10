package com.syncro.backend.domain.relocation.entity;

import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.expats.entity.ExpatsAnonymousSession;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "relocation_profiles")
public class RelocationProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "user_type", nullable = false, length = 30)
    private String userType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_city_id")
    private RelocationCityDataset targetCity;

    @Column(name = "target_city_name", length = 255)
    private String targetCityName;

    @Column(name = "target_country", length = 100)
    private String targetCountry;

    @Column(name = "household", nullable = false, length = 30)
    private String household;

    @Column(name = "has_pets", nullable = false)
    private Boolean hasPets;

    @Column(name = "children_age_range", length = 50)
    private String childrenAgeRange;

    @Column(name = "monthly_budget", nullable = false, precision = 10, scale = 2)
    private BigDecimal monthlyBudget;

    @Column(name = "primary_goal", nullable = false, length = 50)
    private String primaryGoal;

    @Column(name = "social_priority", nullable = false, length = 20)
    private String socialPriority;

    @Column(name = "desired_lifestyle", nullable = false, length = 30)
    private String desiredLifestyle;

    @Column(name = "work_status", nullable = false, length = 30)
    private String workStatus;

    @Column(name = "is_remote", nullable = false)
    private Boolean isRemote;

    @Column(name = "priority_problem", nullable = false, length = 50)
    private String priorityProblem;

    @Column(name = "free_notes", columnDefinition = "TEXT")
    private String freeNotes;

    @Column(name = "completed_steps", nullable = false)
    private Integer completedSteps;

    @Column(name = "completion_percent", nullable = false)
    private Integer completionPercent;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "converted_from_session_id")
    private ExpatsAnonymousSession convertedFromSession;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (hasPets == null) hasPets = false;
        if (isRemote == null) isRemote = false;
        if (completedSteps == null) completedSteps = 0;
        if (completionPercent == null) completionPercent = 0;
        if (status == null) status = "IN_PROGRESS";
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

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getUserType() { return userType; }
    public void setUserType(String userType) { this.userType = userType; }

    public RelocationCityDataset getTargetCity() { return targetCity; }
    public void setTargetCity(RelocationCityDataset targetCity) { this.targetCity = targetCity; }

    public String getTargetCityName() { return targetCityName; }
    public void setTargetCityName(String targetCityName) { this.targetCityName = targetCityName; }

    public String getTargetCountry() { return targetCountry; }
    public void setTargetCountry(String targetCountry) { this.targetCountry = targetCountry; }

    public String getHousehold() { return household; }
    public void setHousehold(String household) { this.household = household; }

    public Boolean getHasPets() { return hasPets; }
    public void setHasPets(Boolean hasPets) { this.hasPets = hasPets; }

    public String getChildrenAgeRange() { return childrenAgeRange; }
    public void setChildrenAgeRange(String childrenAgeRange) { this.childrenAgeRange = childrenAgeRange; }

    public BigDecimal getMonthlyBudget() { return monthlyBudget; }
    public void setMonthlyBudget(BigDecimal monthlyBudget) { this.monthlyBudget = monthlyBudget; }

    public String getPrimaryGoal() { return primaryGoal; }
    public void setPrimaryGoal(String primaryGoal) { this.primaryGoal = primaryGoal; }

    public String getSocialPriority() { return socialPriority; }
    public void setSocialPriority(String socialPriority) { this.socialPriority = socialPriority; }

    public String getDesiredLifestyle() { return desiredLifestyle; }
    public void setDesiredLifestyle(String desiredLifestyle) { this.desiredLifestyle = desiredLifestyle; }

    public String getWorkStatus() { return workStatus; }
    public void setWorkStatus(String workStatus) { this.workStatus = workStatus; }

    public Boolean getIsRemote() { return isRemote; }
    public void setIsRemote(Boolean isRemote) { this.isRemote = isRemote; }

    public String getPriorityProblem() { return priorityProblem; }
    public void setPriorityProblem(String priorityProblem) { this.priorityProblem = priorityProblem; }

    public String getFreeNotes() { return freeNotes; }
    public void setFreeNotes(String freeNotes) { this.freeNotes = freeNotes; }

    public Integer getCompletedSteps() { return completedSteps; }
    public void setCompletedSteps(Integer completedSteps) { this.completedSteps = completedSteps; }

    public Integer getCompletionPercent() { return completionPercent; }
    public void setCompletionPercent(Integer completionPercent) { this.completionPercent = completionPercent; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public ExpatsAnonymousSession getConvertedFromSession() { return convertedFromSession; }
    public void setConvertedFromSession(ExpatsAnonymousSession convertedFromSession) { this.convertedFromSession = convertedFromSession; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
