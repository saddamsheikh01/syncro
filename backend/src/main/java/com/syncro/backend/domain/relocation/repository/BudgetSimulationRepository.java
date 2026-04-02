package com.syncro.backend.domain.relocation.repository;

import com.syncro.backend.domain.relocation.entity.BudgetSimulation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface BudgetSimulationRepository extends JpaRepository<BudgetSimulation, UUID> {

    // User queries
    List<BudgetSimulation> findByUser_IdOrderByCreatedAtDesc(UUID userId);
    List<BudgetSimulation> findByUser_IdAndPlanCodeOrderByCreatedAtDesc(UUID userId, String planCode);
    List<BudgetSimulation> findByAnonymousSession_IdOrderByCreatedAtDesc(UUID sessionId);

    // Admin queries — paginated
    Page<BudgetSimulation> findByOrderByCreatedAtDesc(Pageable pageable);
    Page<BudgetSimulation> findByAnonymousSessionIsNotNullOrderByCreatedAtDesc(Pageable pageable);
    Page<BudgetSimulation> findByUserIsNotNullOrderByCreatedAtDesc(Pageable pageable);
    Page<BudgetSimulation> findByPlanCodeOrderByCreatedAtDesc(String planCode, Pageable pageable);
    Page<BudgetSimulation> findByCity_IdOrderByCreatedAtDesc(UUID cityId, Pageable pageable);

    // Admin stats
    long countByAnonymousSessionIsNotNull();
    long countByUserIsNotNull();
    long countByCreatedAtAfter(Instant since);

    @Query("SELECT s.city.cityName, COUNT(s) FROM BudgetSimulation s WHERE s.city IS NOT NULL GROUP BY s.city.cityName ORDER BY COUNT(s) DESC")
    List<Object[]> countByCity();

    @Query("SELECT s.planCode, COUNT(s) FROM BudgetSimulation s GROUP BY s.planCode")
    List<Object[]> countByPlanCode();
}
