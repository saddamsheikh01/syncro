package com.syncro.backend.domain.social.repository;

import com.syncro.backend.domain.social.entity.Connection;
import com.syncro.backend.domain.social.entity.ConnectionStatus;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ConnectionRepository extends JpaRepository<Connection, UUID> {

    Optional<Connection> findByFromUserIdAndToUserId(UUID fromUserId, UUID toUserId);

    Page<Connection> findByFromUserIdOrToUserIdOrderByUpdatedAtDesc(
        UUID fromUserId,
        UUID toUserId,
        Pageable pageable
    );

    Page<Connection> findByToUserIdAndStatus(UUID toUserId, ConnectionStatus status, Pageable pageable);

    @Query("""
        SELECT c FROM Connection c
        WHERE c.status = 'ACCEPTED'
        AND ((c.fromUserId = :userId1 AND c.toUserId = :userId2)
             OR (c.fromUserId = :userId2 AND c.toUserId = :userId1))
        """)
    Optional<Connection> findAcceptedConnectionBetween(
        @Param("userId1") UUID userId1,
        @Param("userId2") UUID userId2
    );

    default boolean hasActiveConnection(UUID userId1, UUID userId2) {
        return findAcceptedConnectionBetween(userId1, userId2).isPresent();
    }

    @Query("""
        SELECT c FROM Connection c
        WHERE c.status = :status
          AND c.updatedAt >= :from
          AND c.updatedAt < :to
        """)
    List<Connection> findByStatusAndUpdatedAtBetween(
        @Param("status") ConnectionStatus status,
        @Param("from") Instant from,
        @Param("to") Instant to
    );

    @Query("""
        SELECT c FROM Connection c
        WHERE c.status = :status
          AND c.updatedAt >= :from
          AND c.updatedAt < :to
        """)
    Page<Connection> findByStatusAndUpdatedAtBetween(
        @Param("status") ConnectionStatus status,
        @Param("from") Instant from,
        @Param("to") Instant to,
        Pageable pageable
    );
}
