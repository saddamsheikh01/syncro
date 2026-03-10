package com.syncro.backend.domain.relocation.repository;

import com.syncro.backend.domain.relocation.entity.RelocationOnboardingSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RelocationOnboardingSnapshotRepository extends JpaRepository<RelocationOnboardingSnapshot, UUID> {

    Optional<RelocationOnboardingSnapshot> findByUserIdAndIsActiveTrue(UUID userId);

    List<RelocationOnboardingSnapshot> findByUserIdOrderByVersionDesc(UUID userId);

    @Query("SELECT COALESCE(MAX(s.version), 0) FROM RelocationOnboardingSnapshot s WHERE s.user.id = :userId")
    int findMaxVersionByUserId(@Param("userId") UUID userId);
}
