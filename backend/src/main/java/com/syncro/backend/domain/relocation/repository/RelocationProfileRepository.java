package com.syncro.backend.domain.relocation.repository;

import com.syncro.backend.domain.relocation.entity.RelocationProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RelocationProfileRepository extends JpaRepository<RelocationProfile, UUID> {

    Optional<RelocationProfile> findByUserId(UUID userId);

    boolean existsByUserId(UUID userId);

    Optional<RelocationProfile> findByConvertedFromSessionId(UUID sessionId);
}
