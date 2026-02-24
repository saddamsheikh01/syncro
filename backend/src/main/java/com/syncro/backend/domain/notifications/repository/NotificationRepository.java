package com.syncro.backend.domain.notifications.repository;

import com.syncro.backend.domain.notifications.entity.Notification;
import com.syncro.backend.domain.notifications.entity.NotificationType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Page<Notification> findByUserId(UUID userId, Pageable pageable);

    Page<Notification> findByUserIdAndReadAtIsNull(UUID userId, Pageable pageable);

    List<Notification> findByUserIdAndReadAtIsNull(UUID userId);

    long countByUserIdAndReadAtIsNull(UUID userId);

    long countByCampaignIdAndType(UUID campaignId, NotificationType type);

    long countByCampaignIdAndTypeAndReadAtIsNotNull(UUID campaignId, NotificationType type);

    boolean existsByUserIdAndMessageId(UUID userId, UUID messageId);

    Optional<Notification> findByIdAndUserId(UUID id, UUID userId);
}
