package com.syncro.backend.domain.social.repository;

import com.syncro.backend.domain.social.entity.ChatConversation;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatConversationRepository extends JpaRepository<ChatConversation, UUID> {
}
