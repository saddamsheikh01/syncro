package com.syncro.backend.domain.notifications.service;

import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.notifications.dto.NotificationResponse;
import com.syncro.backend.domain.notifications.dto.UnreadCountResponse;
import com.syncro.backend.domain.notifications.entity.Notification;
import com.syncro.backend.domain.notifications.entity.NotificationType;
import com.syncro.backend.domain.notifications.mapper.NotificationMapper;
import com.syncro.backend.domain.notifications.repository.NotificationRepository;
import com.syncro.backend.domain.social.entity.ChatMessage;
import com.syncro.backend.security.UserPrincipal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private static final int MESSAGE_PREVIEW_LIMIT = 160;

    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;
    private final UserRepository userRepository;

    public NotificationService(
        NotificationRepository notificationRepository,
        NotificationMapper notificationMapper,
        UserRepository userRepository
    ) {
        this.notificationRepository = notificationRepository;
        this.notificationMapper = notificationMapper;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(
        UserPrincipal principal,
        boolean unreadOnly,
        int page,
        int size
    ) {
        User user = getUser(principal);
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));
        Page<Notification> notifications = unreadOnly
            ? notificationRepository.findByUserIdAndReadAtIsNull(user.getId(), pageable)
            : notificationRepository.findByUserId(user.getId(), pageable);
        return notifications.map(notificationMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse getUnreadCount(UserPrincipal principal) {
        User user = getUser(principal);
        long count = notificationRepository.countByUserIdAndReadAtIsNull(user.getId());
        return new UnreadCountResponse(count);
    }

    @Transactional
    public NotificationResponse markAsRead(UserPrincipal principal, UUID notificationId) {
        User user = getUser(principal);
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, user.getId())
            .orElseThrow(() -> new NotFoundException("Notifica non trovata"));
        if (notification.getReadAt() == null) {
            notification.setReadAt(Instant.now());
            notificationRepository.save(notification);
        }
        return notificationMapper.toResponse(notification);
    }

    @Transactional
    public void markAllAsRead(UserPrincipal principal) {
        User user = getUser(principal);
        List<Notification> unread = notificationRepository.findByUserIdAndReadAtIsNull(user.getId());
        if (unread.isEmpty()) {
            return;
        }
        Instant now = Instant.now();
        unread.forEach(notification -> notification.setReadAt(now));
        notificationRepository.saveAll(unread);
    }

    @Transactional
    public void createMessageNotifications(
        UUID conversationId,
        ChatMessage message,
        List<UUID> recipientIds
    ) {
        if (message == null || recipientIds == null || recipientIds.isEmpty()) {
            return;
        }
        List<Notification> notifications = new ArrayList<>();
        for (UUID userId : recipientIds) {
            if (userId == null) {
                continue;
            }
            if (notificationRepository.existsByUserIdAndMessageId(userId, message.getId())) {
                continue;
            }
            Notification notification = new Notification();
            notification.setUserId(userId);
            notification.setType(NotificationType.MESSAGE);
            notification.setTitle("Nuovo messaggio");
            notification.setBody(buildMessagePreview(message.getContent()));
            notification.setConversationId(conversationId);
            notification.setMessageId(message.getId());
            notification.setData(buildMessageData(message, conversationId));
            notifications.add(notification);
        }
        if (!notifications.isEmpty()) {
            notificationRepository.saveAll(notifications);
        }
    }

    private Map<String, Object> buildMessageData(ChatMessage message, UUID conversationId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("conversationId", conversationId);
        payload.put("messageId", message.getId());
        payload.put("senderId", message.getUserId());
        return payload;
    }

    private String buildMessagePreview(String content) {
        if (content == null) {
            return null;
        }
        String normalized = content.trim();
        if (normalized.length() <= MESSAGE_PREVIEW_LIMIT) {
            return normalized;
        }
        return normalized.substring(0, MESSAGE_PREVIEW_LIMIT - 3) + "...";
    }

    private User getUser(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        UUID userId = principal.userId();
        return userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
    }
}
