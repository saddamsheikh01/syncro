package com.syncro.backend.domain.relocation.repository;

import com.syncro.backend.domain.relocation.entity.StarterKitReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface StarterKitReportRepository extends JpaRepository<StarterKitReport, UUID> {
    Optional<StarterKitReport> findFirstByUser_IdOrderByCreatedAtDesc(UUID userId);
}
