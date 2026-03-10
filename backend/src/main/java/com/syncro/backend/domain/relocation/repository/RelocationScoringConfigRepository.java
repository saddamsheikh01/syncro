package com.syncro.backend.domain.relocation.repository;

import com.syncro.backend.domain.relocation.entity.RelocationScoringConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RelocationScoringConfigRepository extends JpaRepository<RelocationScoringConfig, UUID> {

    Optional<RelocationScoringConfig> findByConfigKeyAndActiveTrue(String configKey);
}
