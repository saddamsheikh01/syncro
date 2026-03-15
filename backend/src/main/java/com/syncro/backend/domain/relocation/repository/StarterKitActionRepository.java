package com.syncro.backend.domain.relocation.repository;

import com.syncro.backend.domain.relocation.entity.StarterKitAction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface StarterKitActionRepository extends JpaRepository<StarterKitAction, UUID> {
    List<StarterKitAction> findByReport_IdOrderByActionOrderAsc(UUID reportId);
}
