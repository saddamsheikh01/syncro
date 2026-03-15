package com.syncro.backend.domain.relocation.repository;

import com.syncro.backend.domain.relocation.entity.MicroTestAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MicroTestAssignmentRepository extends JpaRepository<MicroTestAssignment, UUID> {

    List<MicroTestAssignment> findByUser_IdAndStatusInOrderByAvailableFromAsc(UUID userId, List<String> statuses);

    Optional<MicroTestAssignment> findFirstByUser_IdAndStatusOrderByAvailableFromAsc(UUID userId, String status);

    @Query("""
        SELECT a FROM MicroTestAssignment a
        WHERE a.user.id = :userId
        AND a.testDefinition.id = :testId
        AND a.completedAt > :since
        """)
    List<MicroTestAssignment> findRecentCompletedByUserAndTest(
        @Param("userId") UUID userId,
        @Param("testId") UUID testId,
        @Param("since") Instant since
    );

    List<MicroTestAssignment> findByUser_IdOrderByCreatedAtDesc(UUID userId);
}
