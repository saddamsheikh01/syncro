package com.syncro.backend.domain.social.repository;

import com.syncro.backend.domain.social.entity.ChatParticipant;
import com.syncro.backend.domain.social.entity.ChatParticipantId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatParticipantRepository extends JpaRepository<ChatParticipant, ChatParticipantId> {

    Page<ChatParticipant> findByUserId(UUID userId, Pageable pageable);

    List<ChatParticipant> findAllByConversationId(UUID conversationId);

    boolean existsByConversationIdAndUserId(UUID conversationId, UUID userId);

    Optional<ChatParticipant> findByConversationIdAndUserId(UUID conversationId, UUID userId);

    @Query(
        value = """
            SELECT cp.conversation_id
            FROM chat_participants cp
            WHERE cp.user_id IN (:userA, :userB)
            GROUP BY cp.conversation_id
            HAVING COUNT(DISTINCT cp.user_id) = 2
               AND (SELECT COUNT(*) FROM chat_participants cp2
                    WHERE cp2.conversation_id = cp.conversation_id) = 2
            LIMIT 1
            """,
        nativeQuery = true
    )
    UUID findPrivateConversationId(@Param("userA") UUID userA, @Param("userB") UUID userB);
}
