package com.syncro.backend.domain.zyra.repository;

import com.syncro.backend.domain.zyra.entity.ZyraChatSession;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ZyraChatSessionRepository extends JpaRepository<ZyraChatSession, UUID> {

    Page<ZyraChatSession> findByUserId(UUID userId, Pageable pageable);

    Optional<ZyraChatSession> findByIdAndUserId(UUID id, UUID userId);

    long deleteByUserId(UUID userId);
}
