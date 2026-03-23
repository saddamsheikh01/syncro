package com.syncro.backend.domain.relocation.repository;

import com.syncro.backend.domain.relocation.entity.BudgetTrackingEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BudgetTrackingEntryRepository extends JpaRepository<BudgetTrackingEntry, UUID> {
    List<BudgetTrackingEntry> findByUser_IdOrderByRecordedAtDesc(UUID userId);
    List<BudgetTrackingEntry> findByUser_IdAndCategoryOrderByRecordedAtDesc(UUID userId, String category);
}
