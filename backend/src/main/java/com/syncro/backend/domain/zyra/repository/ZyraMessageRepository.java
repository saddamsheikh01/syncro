package com.syncro.backend.domain.zyra.repository;

import com.syncro.backend.domain.zyra.entity.ZyraMessage;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ZyraMessageRepository extends JpaRepository<ZyraMessage, UUID> {

    Page<ZyraMessage> findBySessionId(UUID sessionId, Pageable pageable);
}
