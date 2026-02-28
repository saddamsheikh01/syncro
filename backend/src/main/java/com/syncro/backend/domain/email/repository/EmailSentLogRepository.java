package com.syncro.backend.domain.email.repository;

import com.syncro.backend.domain.email.entity.EmailSentLog;
import com.syncro.backend.domain.email.entity.EmailType;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailSentLogRepository extends JpaRepository<EmailSentLog, UUID> {

    Optional<EmailSentLog> findTop1ByUserIdAndEmailTypeOrderBySentAtDesc(UUID userId, EmailType type);

    boolean existsByUserIdAndEmailTypeAndSentAtAfter(UUID userId, EmailType type, Instant after);
}
