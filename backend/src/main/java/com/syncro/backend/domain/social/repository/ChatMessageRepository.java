package com.syncro.backend.domain.social.repository;

import com.syncro.backend.domain.social.entity.ChatMessage;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    @Query("select distinct m.userId from ChatMessage m where m.userId in :userIds")
    List<UUID> findDistinctUserIdsByUserIdIn(@Param("userIds") Collection<UUID> userIds);

    Page<ChatMessage> findByConversationIdOrderByCreatedAtDesc(UUID conversationId, Pageable pageable);

    Optional<ChatMessage> findFirstByConversationIdOrderByCreatedAtDesc(UUID conversationId);

    @Query("SELECT m FROM ChatMessage m WHERE m.conversationId IN :conversationIds " +
           "AND m.createdAt = (SELECT MAX(m2.createdAt) FROM ChatMessage m2 WHERE m2.conversationId = m.conversationId)")
    List<ChatMessage> findLastMessagesByConversationIds(@Param("conversationIds") List<UUID> conversationIds);
}
