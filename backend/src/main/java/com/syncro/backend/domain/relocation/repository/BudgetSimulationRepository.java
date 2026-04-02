package com.syncro.backend.domain.relocation.repository;

import com.syncro.backend.domain.relocation.entity.BudgetSimulation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BudgetSimulationRepository extends JpaRepository<BudgetSimulation, UUID> {
    List<BudgetSimulation> findByUser_IdOrderByCreatedAtDesc(UUID userId);
    List<BudgetSimulation> findByUser_IdAndPlanCodeOrderByCreatedAtDesc(UUID userId, String planCode);
    List<BudgetSimulation> findByAnonymousSession_IdOrderByCreatedAtDesc(UUID sessionId);
    long countByAnonymousSessionIsNotNull();
    long countByUserIsNotNull();
}
