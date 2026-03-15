package com.syncro.backend.domain.relocation.entity;

import com.syncro.backend.domain.auth.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "budget_simulations")
public class BudgetSimulation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "city_id")
    private RelocationCityDataset city;

    @Column(name = "scenario", length = 30)
    private String scenario;

    @Column(name = "plan_code", nullable = false, length = 20)
    private String planCode;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "input_payload", columnDefinition = "jsonb")
    private Map<String, Object> inputPayload;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "output_payload", columnDefinition = "jsonb")
    private Map<String, Object> outputPayload;

    @Column(name = "algorithm_version", length = 20)
    private String algorithmVersion;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (algorithmVersion == null) algorithmVersion = "1.0";
        createdAt = Instant.now();
    }

    // Getters and Setters

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public RelocationCityDataset getCity() { return city; }
    public void setCity(RelocationCityDataset city) { this.city = city; }

    public String getScenario() { return scenario; }
    public void setScenario(String scenario) { this.scenario = scenario; }

    public String getPlanCode() { return planCode; }
    public void setPlanCode(String planCode) { this.planCode = planCode; }

    public Map<String, Object> getInputPayload() { return inputPayload; }
    public void setInputPayload(Map<String, Object> inputPayload) { this.inputPayload = inputPayload; }

    public Map<String, Object> getOutputPayload() { return outputPayload; }
    public void setOutputPayload(Map<String, Object> outputPayload) { this.outputPayload = outputPayload; }

    public String getAlgorithmVersion() { return algorithmVersion; }
    public void setAlgorithmVersion(String algorithmVersion) { this.algorithmVersion = algorithmVersion; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
