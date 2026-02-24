package com.syncro.backend.domain.notifications.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.entity.AdminRole;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.entity.UserStatus;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.notifications.dto.AdminNotificationCampaignStatsResponse;
import com.syncro.backend.domain.notifications.dto.AdminNotificationCampaignSummaryResponse;
import com.syncro.backend.domain.notifications.dto.AdminCreateNotificationRequest;
import com.syncro.backend.domain.notifications.dto.AdminNotificationRecipientResponse;
import com.syncro.backend.domain.notifications.dto.AdminNotificationTargetType;
import com.syncro.backend.domain.notifications.dto.NotificationResponse;
import com.syncro.backend.domain.notifications.entity.Notification;
import com.syncro.backend.domain.notifications.entity.NotificationType;
import com.syncro.backend.domain.notifications.mapper.NotificationMapper;
import com.syncro.backend.domain.notifications.repository.NotificationRepository;
import com.syncro.backend.domain.profile.entity.UserProfile;
import com.syncro.backend.domain.profile.repository.UserProfileRepository;
import com.syncro.backend.security.AdminPrincipal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminNotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final JdbcTemplate jdbcTemplate;

    public AdminNotificationService(
        NotificationRepository notificationRepository,
        NotificationMapper notificationMapper,
        UserRepository userRepository,
        UserProfileRepository userProfileRepository,
        JdbcTemplate jdbcTemplate
    ) {
        this.notificationRepository = notificationRepository;
        this.notificationMapper = notificationMapper;
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public List<NotificationResponse> createCustomNotifications(
        AdminPrincipal principal,
        AdminCreateNotificationRequest request
    ) {
        ensureAdmin(principal);
        List<User> users = resolveRecipients(request);
        String title = normalizeRequired(request.title(), "Titolo non valido");
        String body = normalizeOptional(request.body());
        UUID campaignId = UUID.randomUUID();
        Map<String, Object> data = request.data() != null
            ? new HashMap<>(request.data())
            : new HashMap<>();

        if (users.isEmpty()) {
            return List.of();
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
            notification.setCampaignId(campaignId);
            notifications.add(notification);
        }
        return notificationRepository.saveAll(notifications)
            .stream()
            .map(notificationMapper::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public AdminNotificationCampaignStatsResponse getCampaignStats(
        AdminPrincipal principal,
        UUID campaignId
    ) {
        ensureAdmin(principal);
        if (campaignId == null) {
            throw new BadRequestException("campaignId non valido");
        }

        long sentCount = notificationRepository.countByCampaignIdAndType(campaignId, NotificationType.CUSTOM);
        if (sentCount == 0) {
            throw new NotFoundException("Campagna notifiche non trovata");
        }
        long readCount = notificationRepository.countByCampaignIdAndTypeAndReadAtIsNotNull(
            campaignId,
            NotificationType.CUSTOM
        );
        long unreadCount = Math.max(0, sentCount - readCount);
        double readRate = roundToTwoDecimals((readCount * 100.0) / sentCount);
        return new AdminNotificationCampaignStatsResponse(
            campaignId,
            sentCount,
            readCount,
            unreadCount,
            readRate
        );
    }

    @Transactional(readOnly = true)
    public Page<AdminNotificationCampaignSummaryResponse> getCampaignHistory(
        AdminPrincipal principal,
        String title,
        Instant from,
        Instant to,
        int page,
        int size,
        String sortBy,
        String direction
    ) {
        ensureAdmin(principal);
        if (from != null && to != null && from.isAfter(to)) {
            throw new BadRequestException("Intervallo date non valido");
        }

        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 50));
        String normalizedTitle = normalizeOptional(title);

        String baseWhere = """
            from notifications n
            where n.type = 'CUSTOM'
              and n.campaign_id is not null
            """;
        List<Object> whereParams = new ArrayList<>();
        if (normalizedTitle != null) {
            baseWhere += " and lower(n.title) like lower(?)";
            whereParams.add("%" + normalizedTitle + "%");
        }
        if (from != null) {
            baseWhere += " and n.created_at >= ?";
            whereParams.add(Timestamp.from(from));
        }
        if (to != null) {
            baseWhere += " and n.created_at <= ?";
            whereParams.add(Timestamp.from(to));
        }

        String countSql = "select count(*) from (select n.campaign_id "
            + baseWhere
            + " group by n.campaign_id) c";
        Long totalElements = jdbcTemplate.queryForObject(countSql, Long.class, whereParams.toArray());
        long total = totalElements != null ? totalElements : 0L;
        if (total == 0L) {
            return Page.empty(PageRequest.of(safePage, safeSize));
        }

        String selectSql = """
            select
              n.campaign_id as campaign_id,
              max(n.title) as title,
              max(n.created_at) as created_at,
              count(*) as sent_count,
              sum(case when n.read_at is not null then 1 else 0 end) as read_count
            """
            + baseWhere
            + " group by n.campaign_id"
            + " order by " + resolveCampaignOrderBy(sortBy, direction)
            + " limit ? offset ?";

        List<Object> selectParams = new ArrayList<>(whereParams);
        selectParams.add(safeSize);
        selectParams.add((long) safePage * safeSize);

        List<AdminNotificationCampaignSummaryResponse> campaigns = jdbcTemplate.query(
            selectSql,
            (rs, rowNum) -> {
                UUID campaignId = rs.getObject("campaign_id", UUID.class);
                String campaignTitle = rs.getString("title");
                Timestamp createdAt = rs.getTimestamp("created_at");
                long sentCount = rs.getLong("sent_count");
                long readCount = rs.getLong("read_count");
                long unreadCount = Math.max(0, sentCount - readCount);
                double readRate = sentCount > 0
                    ? roundToTwoDecimals((readCount * 100.0) / sentCount)
                    : 0.0;
                return new AdminNotificationCampaignSummaryResponse(
                    campaignId,
                    normalizeOptional(campaignTitle),
                    createdAt != null ? createdAt.toInstant() : null,
                    sentCount,
                    readCount,
                    unreadCount,
                    readRate
                );
            },
            selectParams.toArray()
        );

        return new PageImpl<>(campaigns, PageRequest.of(safePage, safeSize), total);
    }

    @Transactional(readOnly = true)
    public Page<AdminNotificationRecipientResponse> searchRecipients(
        AdminPrincipal principal,
        String q,
        int page,
        int size
    ) {
        ensureAdmin(principal);
        String normalizedQuery = normalizeSearchQuery(q);
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 20));
        PageRequest pageable = PageRequest.of(safePage, safeSize);

        if (normalizedQuery == null) {
            return Page.empty(pageable);
        }

        Page<User> usersPage = userRepository.searchNotificationRecipients(
            normalizedQuery,
            UserStatus.ACTIVE,
            pageable
        );

        List<UUID> userIds = usersPage.getContent().stream().map(User::getId).toList();
        Map<UUID, String> fullNameByUserId = new HashMap<>();
        if (!userIds.isEmpty()) {
            for (UserProfile profile : userProfileRepository.findByUserIdIn(userIds)) {
                if (profile.getUser() != null && profile.getUser().getId() != null) {
                    fullNameByUserId.put(profile.getUser().getId(), normalizeOptional(profile.getFullName()));
                }
            }
        }

        return usersPage.map(user -> new AdminNotificationRecipientResponse(
            user.getId(),
            normalizeOptional(user.getUsername()),
            fullNameByUserId.get(user.getId()),
            user.getStatus()
        ));
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

    private List<User> resolveRecipients(AdminCreateNotificationRequest request) {
        if (request.targetType() == AdminNotificationTargetType.ALL) {
            return userRepository.findAllByStatus(UserStatus.ACTIVE);
        }
        if (request.userId() == null) {
            throw new BadRequestException("Utente destinatario non valido");
        }
        User user = userRepository.findById(request.userId())
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BadRequestException("L'utente selezionato non è attivo");
        }
        return List.of(user);
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

    private String normalizeSearchQuery(String query) {
        String normalized = normalizeOptional(query);
        if (normalized == null || normalized.length() < 2) {
            return null;
        }
        return normalized;
    }

    private double roundToTwoDecimals(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private String resolveCampaignOrderBy(String sortBy, String direction) {
        String normalizedSortBy = sortBy == null ? "CREATED_AT" : sortBy.trim().toUpperCase(Locale.ROOT);
        String normalizedDirection = direction == null ? "DESC" : direction.trim().toUpperCase(Locale.ROOT);
        boolean ascending = "ASC".equals(normalizedDirection);

        String orderField = switch (normalizedSortBy) {
            case "READ_RATE" -> "(sum(case when n.read_at is not null then 1 else 0 end)::double precision / nullif(count(*), 0))";
            case "SENT_COUNT" -> "count(*)";
            case "READ_COUNT" -> "sum(case when n.read_at is not null then 1 else 0 end)";
            case "TITLE" -> "max(n.title)";
            case "CREATED_AT" -> "max(n.created_at)";
            default -> throw new BadRequestException("sortBy non valido");
        };
        String orderDirection = ascending ? "asc" : "desc";
        return orderField + " " + orderDirection + ", max(n.created_at) desc";
    }
}
