package com.syncro.backend.domain.notifications.mapper;

import com.syncro.backend.domain.notifications.dto.NotificationResponse;
import com.syncro.backend.domain.notifications.entity.Notification;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

    public NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
            notification.getId(),
            notification.getUserId(),
            notification.getType(),
            notification.getTitle(),
            notification.getBody(),
            notification.getData(),
            notification.getConversationId(),
            notification.getMessageId(),
            notification.getCreatedByAdminId(),
            notification.getCreatedAt(),
            notification.getReadAt()
        );
    }
}
