package com.syncro.backend.domain.expats.repository;

import com.syncro.backend.domain.expats.entity.ExpatsAnonymousSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExpatsAnonymousSessionRepository extends JpaRepository<ExpatsAnonymousSession, UUID> {

    Optional<ExpatsAnonymousSession> findBySessionToken(String sessionToken);

    /** Admin: lista paginata di tutte le sessioni, ordinate per data creazione discendente. */
    Page<ExpatsAnonymousSession> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /** Admin: filtra sessioni per stato. */
    Page<ExpatsAnonymousSession> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    /** Analytics: sessioni create tra due date. */
    List<ExpatsAnonymousSession> findByCreatedAtBetweenOrderByCreatedAtDesc(Instant from, Instant to);

    boolean existsByConvertedUserIdAndStatusNot(UUID userId, String status);

    Optional<ExpatsAnonymousSession> findByConvertedUserId(UUID userId);

    List<ExpatsAnonymousSession> findByStatusAndExpiresAtBefore(String status, Instant cutoff);

    @Modifying
    @Query("UPDATE ExpatsAnonymousSession s SET s.status = 'EXPIRED', s.updatedAt = :now WHERE s.status = 'IN_PROGRESS' AND s.expiresAt < :cutoff")
    int expireSessionsBefore(@Param("cutoff") Instant cutoff, @Param("now") Instant now);
}
