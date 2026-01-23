package com.syncro.backend.domain.notifications.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.entity.AdminRole;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.notifications.dto.AdminCreateNotificationRequest;
import com.syncro.backend.domain.notifications.dto.NotificationResponse;
import com.syncro.backend.domain.notifications.entity.Notification;
import com.syncro.backend.domain.notifications.entity.NotificationType;
import com.syncro.backend.domain.notifications.mapper.NotificationMapper;
import com.syncro.backend.domain.notifications.repository.NotificationRepository;
import com.syncro.backend.security.AdminPrincipal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminNotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;
    private final UserRepository userRepository;

    public AdminNotificationService(
        NotificationRepository notificationRepository,
        NotificationMapper notificationMapper,
        UserRepository userRepository
    ) {
        this.notificationRepository = notificationRepository;
        this.notificationMapper = notificationMapper;
        this.userRepository = userRepository;
    }

    @Transactional
    public List<NotificationResponse> createCustomNotifications(
        AdminPrincipal principal,
        AdminCreateNotificationRequest request
    ) {
        ensureAdmin(principal);
        List<UUID> userIds = normalizeUserIds(request.userIds());
        String title = normalizeRequired(request.title(), "Titolo non valido");
        String body = normalizeOptional(request.body());
        Map<String, Object> data = request.data() != null ? request.data() : new HashMap<>();

        List<User> users = userRepository.findAllById(userIds);
        if (users.size() != userIds.size()) {
            Set<UUID> foundIds = users.stream().map(User::getId).collect(Collectors.toSet());
            List<UUID> missing = userIds.stream()
                .filter(id -> !foundIds.contains(id))
                .toList();
            throw new NotFoundException("Utenti non trovati: " + missing);
        }

        List<Notification> notifications = new ArrayList<>();
        for (User user : users) {
            Notification notification = new Notification();
            notification.setUserId(user.getId());
            notification.setType(NotificationType.CUSTOM);
            notification.setTitle(title);
            notification.setBody(body);
            notification.setData(new HashMap<>(data));
            notification.setCreatedByAdminId(principal.adminId());
            notifications.add(notification);
        }
        return notificationRepository.saveAll(notifications)
            .stream()
            .map(notificationMapper::toResponse)
            .toList();
    }

    private void ensureAdmin(AdminPrincipal principal) {
        if (principal == null || principal.role() == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        AdminRole role = AdminRole.valueOf(principal.role());
        if (role != AdminRole.ADMIN && role != AdminRole.SUPER_ADMIN) {
            throw new UnauthorizedException("Permesso negato");
        }
    }

    private List<UUID> normalizeUserIds(List<UUID> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            throw new BadRequestException("Lista utenti non valida");
        }
        Set<UUID> normalized = new LinkedHashSet<>();
        for (UUID id : userIds) {
            if (id != null) {
                normalized.add(id);
            }
        }
        if (normalized.isEmpty()) {
            throw new BadRequestException("Lista utenti non valida");
        }
        return List.copyOf(normalized);
    }

    private String normalizeRequired(String value, String message) {
        if (value == null) {
            throw new BadRequestException(message);
        }
        String normalized = value.trim();
        if (normalized.isBlank()) {
            throw new BadRequestException(message);
        }
        return normalized;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }
}
