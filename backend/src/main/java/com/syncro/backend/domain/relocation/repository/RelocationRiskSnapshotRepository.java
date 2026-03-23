package com.syncro.backend.domain.relocation.repository;

import com.syncro.backend.domain.relocation.entity.RelocationRiskSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RelocationRiskSnapshotRepository extends JpaRepository<RelocationRiskSnapshot, UUID> {
    List<RelocationRiskSnapshot> findByUser_IdOrderByCreatedAtDesc(UUID userId);
    Optional<RelocationRiskSnapshot> findFirstByUser_IdOrderByCreatedAtDesc(UUID userId);
}
