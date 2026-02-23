package com.syncro.backend.domain.analytics.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.analytics.dto.AnalyticsBatchEventRequest;
import com.syncro.backend.domain.analytics.dto.AnalyticsBatchRequest;
import com.syncro.backend.domain.analytics.dto.AnalyticsBatchResponse;
import com.syncro.backend.domain.analytics.dto.AnalyticsEventRequest;
import com.syncro.backend.domain.analytics.dto.AnalyticsKpiResponse;
import com.syncro.backend.domain.analytics.dto.KpiPoint;
import com.syncro.backend.domain.analytics.entity.AnalyticsEvent;
import com.syncro.backend.domain.analytics.entity.AnalyticsEventDefinition;
import com.syncro.backend.domain.analytics.entity.AnalyticsEventType;
import com.syncro.backend.domain.analytics.entity.AnalyticsIngestionError;
import com.syncro.backend.domain.analytics.repository.AnalyticsBucketCountProjection;
import com.syncro.backend.domain.analytics.repository.AnalyticsDailyKpiProjection;
import com.syncro.backend.domain.analytics.repository.AnalyticsDailyKpiRepository;
import com.syncro.backend.domain.analytics.repository.AnalyticsEventDefinitionRepository;
import com.syncro.backend.domain.analytics.repository.AnalyticsEventRepository;
import com.syncro.backend.domain.analytics.repository.AnalyticsIngestionErrorRepository;
import com.syncro.backend.domain.analytics.repository.AnalyticsSessionRepository;
import com.syncro.backend.domain.analytics.entity.AnalyticsSession;
import com.syncro.backend.domain.auth.entity.AdminRole;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.security.AdminPrincipal;
import com.syncro.backend.security.UserPrincipal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AnalyticsService {

    private static final Logger logger = LoggerFactory.getLogger(AnalyticsService.class);

    private static final int DEFAULT_RANGE_DAYS = 30;
    private static final int WEEK_DAYS = 7;
    private static final int DEFAULT_EVENT_VERSION = 1;

    private static final String DURATION_KEY = "duration_seconds";
    private static final String DURATION_FALLBACK_KEY = "durationSeconds";

    private static final String KPI_REGISTRATIONS_DAILY = "registrations_daily";
    private static final String KPI_ONBOARDING_DAILY = "onboarding_completed_daily";
    private static final String KPI_MATCH_SECTION_DAILY = "match_section_opened_daily";
    private static final String KPI_PROFILE_VIEWED_DAILY = "profile_viewed_daily";
    private static final String KPI_MAP_OPENED_DAILY = "map_opened_daily";
    private static final String KPI_AVG_SESSION_DAILY = "avg_session_duration_seconds_daily";

    private final AnalyticsEventRepository analyticsEventRepository;
    private final AnalyticsEventDefinitionRepository analyticsEventDefinitionRepository;
    private final AnalyticsIngestionErrorRepository analyticsIngestionErrorRepository;
    private final AnalyticsSessionRepository analyticsSessionRepository;
    private final AnalyticsDailyKpiRepository analyticsDailyKpiRepository;
    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;

    public AnalyticsService(
        AnalyticsEventRepository analyticsEventRepository,
        AnalyticsEventDefinitionRepository analyticsEventDefinitionRepository,
        AnalyticsIngestionErrorRepository analyticsIngestionErrorRepository,
        AnalyticsSessionRepository analyticsSessionRepository,
        AnalyticsDailyKpiRepository analyticsDailyKpiRepository,
        UserRepository userRepository,
        JdbcTemplate jdbcTemplate
    ) {
        this.analyticsEventRepository = analyticsEventRepository;
        this.analyticsEventDefinitionRepository = analyticsEventDefinitionRepository;
        this.analyticsIngestionErrorRepository = analyticsIngestionErrorRepository;
        this.analyticsSessionRepository = analyticsSessionRepository;
        this.analyticsDailyKpiRepository = analyticsDailyKpiRepository;
        this.userRepository = userRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public void trackEvent(UserPrincipal principal, AnalyticsEventRequest request) {
        User user = getUser(principal);
        AnalyticsEventType eventType = request.eventType();
        if (eventType == null) {
            throw new BadRequestException("Evento non valido");
        }

        persistValidatedEvent(
            user.getId(),
            eventType.name(),
            DEFAULT_EVENT_VERSION,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            "web",
            Boolean.TRUE,
            null,
            request.payload(),
            true
        );
    }

    @Transactional
    public AnalyticsBatchResponse trackEventsBatch(UserPrincipal principal, AnalyticsBatchRequest request) {
        User user = getUser(principal);

        int accepted = 0;
        int duplicates = 0;
        int rejected = 0;

        for (AnalyticsBatchEventRequest event : request.events()) {
            if (event == null) {
                rejected++;
                saveIngestionError(
                    user.getId(),
                    null,
                    Map.of(),
                    "VALIDATION_ERROR",
                    "Evento batch nullo"
                );
                continue;
            }
            try {
                TrackingOutcome outcome = persistValidatedEvent(
                    user.getId(),
                    event.eventName(),
                    event.eventVersion(),
                    event.eventId(),
                    event.idempotencyKey(),
                    event.sessionId(),
                    event.occurredAt(),
                    event.route(),
                    event.platform(),
                    event.appVersion(),
                    event.eventSource(),
                    event.consentAnalytics(),
                    event.userAgent(),
                    event.payload(),
                    true
                );

                if (outcome == TrackingOutcome.DUPLICATE) {
                    duplicates++;
                } else {
                    accepted++;
                }
            } catch (RuntimeException ex) {
                rejected++;
                saveIngestionError(
                    user.getId(),
                    event.idempotencyKey(),
                    toRawEventMap(event),
                    "VALIDATION_ERROR",
                    ex.getMessage()
                );
            }
        }

        return new AnalyticsBatchResponse(accepted, duplicates, rejected);
    }

    @Transactional
    public void trackServerEvent(UUID userId, String eventName, Map<String, Object> payload) {
        persistValidatedEvent(
            userId,
            eventName,
            DEFAULT_EVENT_VERSION,
            null,
            null,
            null,
            Instant.now(),
            null,
            null,
            null,
            "backend",
            Boolean.TRUE,
            null,
            payload,
            true
        );
    }

    public void trackServerEventSafe(UUID userId, String eventName, Map<String, Object> payload) {
        try {
            trackServerEvent(userId, eventName, payload);
        } catch (RuntimeException ex) {
            logger.warn("Tracciamento server event fallito: {}", ex.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public AnalyticsKpiResponse getKpis(AdminPrincipal principal, LocalDate from, LocalDate to) {
        ensureAdmin(principal);
        LocalDate endDate = to != null ? to : LocalDate.now(ZoneOffset.UTC);
        LocalDate startDate = from != null ? from : endDate.minusDays(DEFAULT_RANGE_DAYS);
        if (startDate.isAfter(endDate)) {
            throw new BadRequestException("Intervallo date non valido");
        }

        Instant fromInstant = startDate.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant toInstant = endDate.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

        boolean hasPreAggregates = analyticsDailyKpiRepository.countInRange(startDate, endDate) > 0;

        List<KpiPoint> registrationsDaily = hasPreAggregates
            ? mapDailyRows(analyticsDailyKpiRepository.findDailyByKpiName(KPI_REGISTRATIONS_DAILY, startDate, endDate))
            : mapBuckets(analyticsEventRepository.countEventsByTypeDaily(
                AnalyticsEventType.USER_REGISTERED.name(),
                fromInstant,
                toInstant
            ));

        List<KpiPoint> registrationsWeekly = hasPreAggregates
            ? mapBuckets(analyticsDailyKpiRepository.findWeeklySumByKpiName(KPI_REGISTRATIONS_DAILY, startDate, endDate))
            : mapBuckets(analyticsEventRepository.countEventsByTypeWeekly(
                AnalyticsEventType.USER_REGISTERED.name(),
                fromInstant,
                toInstant
            ));

        List<KpiPoint> onboardingDaily = hasPreAggregates
            ? mapDailyRows(analyticsDailyKpiRepository.findDailyByKpiName(KPI_ONBOARDING_DAILY, startDate, endDate))
            : mapBuckets(analyticsEventRepository.countEventsByTypeDaily(
                AnalyticsEventType.ONBOARDING_COMPLETED.name(),
                fromInstant,
                toInstant
            ));

        List<KpiPoint> onboardingWeekly = hasPreAggregates
            ? mapBuckets(analyticsDailyKpiRepository.findWeeklySumByKpiName(KPI_ONBOARDING_DAILY, startDate, endDate))
            : mapBuckets(analyticsEventRepository.countEventsByTypeWeekly(
                AnalyticsEventType.ONBOARDING_COMPLETED.name(),
                fromInstant,
                toInstant
            ));

        List<KpiPoint> activeUsersDaily = mapBuckets(analyticsEventRepository.countUniqueUsersDaily(
            fromInstant,
            toInstant
        ));

        List<KpiPoint> activeUsersWeekly = mapBuckets(analyticsEventRepository.countUniqueUsersWeekly(
            fromInstant,
            toInstant
        ));

        List<KpiPoint> matchSectionOpenedDaily = hasPreAggregates
            ? mapDailyRows(analyticsDailyKpiRepository.findDailyByKpiName(KPI_MATCH_SECTION_DAILY, startDate, endDate))
            : mapBuckets(analyticsEventRepository.countEventsByTypeDaily(
                AnalyticsEventType.MATCH_SECTION_OPENED.name(),
                fromInstant,
                toInstant
            ));

        List<KpiPoint> profileViewedDaily = hasPreAggregates
            ? mapDailyRows(analyticsDailyKpiRepository.findDailyByKpiName(KPI_PROFILE_VIEWED_DAILY, startDate, endDate))
            : mapBuckets(analyticsEventRepository.countEventsByTypeDaily(
                AnalyticsEventType.PROFILE_VIEWED.name(),
                fromInstant,
                toInstant
            ));

        List<KpiPoint> mapOpenedDaily = hasPreAggregates
            ? mapDailyRows(analyticsDailyKpiRepository.findDailyByKpiName(KPI_MAP_OPENED_DAILY, startDate, endDate))
            : mapBuckets(analyticsEventRepository.countEventsByTypeDaily(
                AnalyticsEventType.MAP_OPENED.name(),
                fromInstant,
                toInstant
            ));

        long returningUsers = computeReturningUsers(endDate);

        double averageSessionDurationSeconds = hasPreAggregates
            ? resolvePreAggregatedAverage(startDate, endDate)
            : resolveAverageSessionDurationRaw(fromInstant, toInstant);

        return new AnalyticsKpiResponse(
            registrationsDaily,
            registrationsWeekly,
            onboardingDaily,
            onboardingWeekly,
            activeUsersDaily,
            activeUsersWeekly,
            returningUsers,
            matchSectionOpenedDaily,
            profileViewedDaily,
            mapOpenedDaily,
            averageSessionDurationSeconds
        );
    }

    @Transactional
    public void refreshDailyKpis(AdminPrincipal principal, LocalDate from, LocalDate to) {
        ensureAdmin(principal);
        refreshDailyKpisInternal(from, to);
    }

    @Transactional
    public void refreshDailyKpis(LocalDate from, LocalDate to) {
        refreshDailyKpisInternal(from, to);
    }

    private void refreshDailyKpisInternal(LocalDate from, LocalDate to) {
        LocalDate endDate = to != null ? to : LocalDate.now(ZoneOffset.UTC);
        LocalDate startDate = from != null ? from : endDate.minusDays(DEFAULT_RANGE_DAYS);
        if (startDate.isAfter(endDate)) {
            throw new BadRequestException("Intervallo date non valido");
        }

        jdbcTemplate.queryForList(
            "SELECT refresh_analytics_daily_kpi(?::date, ?::date)",
            startDate,
            endDate
        );
    }

    private double resolvePreAggregatedAverage(LocalDate from, LocalDate to) {
        Double average = analyticsDailyKpiRepository.findAverageByKpiName(KPI_AVG_SESSION_DAILY, from, to);
        return average == null ? 0.0 : average;
    }

    private long computeReturningUsers(LocalDate endDate) {
        LocalDate currentStart = endDate.minusDays(WEEK_DAYS - 1L);
        Instant currentFrom = currentStart.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant currentTo = endDate.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant previousFrom = currentStart.minusDays(WEEK_DAYS).atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant previousTo = currentStart.atStartOfDay(ZoneOffset.UTC).toInstant();
        return analyticsEventRepository.countReturningUsers(currentFrom, currentTo, previousFrom, previousTo);
    }

    private double resolveAverageSessionDurationRaw(Instant from, Instant to) {
        Double average = analyticsEventRepository.averageSessionDuration(from, to);
        if (average == null) {
            return 0.0;
        }
        return average.doubleValue();
    }

    private List<KpiPoint> mapBuckets(List<AnalyticsBucketCountProjection> rows) {
        return rows.stream()
            .map(row -> new KpiPoint(row.getBucket(), row.getTotal()))
            .toList();
    }

    private List<KpiPoint> mapDailyRows(List<AnalyticsDailyKpiProjection> rows) {
        return rows.stream()
            .map(row -> new KpiPoint(row.getMetricDate().atStartOfDay(ZoneOffset.UTC).toInstant(), row.getValue().longValue()))
            .toList();
    }

    private TrackingOutcome persistValidatedEvent(
        UUID userId,
        String eventName,
        Integer eventVersion,
        UUID eventId,
        String idempotencyKey,
        UUID sessionId,
        Instant occurredAt,
        String route,
        String platform,
        String appVersion,
        String eventSource,
        Boolean consentAnalytics,
        String userAgent,
        Map<String, Object> payload,
        boolean enforceDefinition
    ) {
        String normalizedEventName = normalizeEventName(eventName);
        int normalizedVersion = eventVersion == null ? DEFAULT_EVENT_VERSION : eventVersion;
        String normalizedIdempotencyKey = normalizeBlank(idempotencyKey);

        if (normalizedIdempotencyKey != null && analyticsEventRepository.existsByIdempotencyKey(normalizedIdempotencyKey)) {
            return TrackingOutcome.DUPLICATE;
        }

        AnalyticsEventDefinition definition = resolveDefinition(normalizedEventName, normalizedVersion, enforceDefinition);
        Map<String, Object> normalizedPayload = normalizePayload(normalizedEventName, payload);
        validateRequiredPayloadKeys(definition, normalizedPayload);

        AnalyticsEvent event = new AnalyticsEvent();
        event.setUserId(userId);
        event.setEventId(eventId != null ? eventId : UUID.randomUUID());
        event.setEventName(normalizedEventName);
        event.setEventType(normalizedEventName);
        event.setEventVersion(normalizedVersion);
        event.setIdempotencyKey(normalizedIdempotencyKey);
        event.setSessionId(sessionId);
        event.setOccurredAt(occurredAt != null ? occurredAt : Instant.now());
        event.setReceivedAt(Instant.now());
        event.setRoute(normalizeBlank(route));
        event.setPlatform(normalizeBlank(platform));
        event.setAppVersion(normalizeBlank(appVersion));
        event.setEventSource(resolveEventSource(eventSource));
        event.setConsentAnalytics(consentAnalytics == null ? Boolean.TRUE : consentAnalytics);
        event.setUserAgent(normalizeBlank(userAgent));
        event.setPayload(normalizedPayload);

        if (sessionId != null && !analyticsSessionRepository.existsById(sessionId)) {
            AnalyticsSession session = new AnalyticsSession();
            session.setSessionId(sessionId);
            session.setUserId(userId);
            session.setStartedAt(event.getOccurredAt() != null ? event.getOccurredAt() : Instant.now());
            session.setPlatform(normalizeBlank(platform));
            session.setAppVersion(normalizeBlank(appVersion));
            session.setRouteStart(normalizeBlank(route));
            analyticsSessionRepository.save(session);
        }

        analyticsEventRepository.save(event);

        return TrackingOutcome.ACCEPTED;
    }

    private AnalyticsEventDefinition resolveDefinition(String eventName, int eventVersion, boolean enforceDefinition) {
        return analyticsEventDefinitionRepository
            .findByEventNameAndEventVersionAndIsActiveTrue(eventName, eventVersion)
            .orElseGet(() -> {
                if (enforceDefinition) {
                    throw new BadRequestException("Evento analytics non supportato");
                }
                return null;
            });
    }

    private void validateRequiredPayloadKeys(AnalyticsEventDefinition definition, Map<String, Object> payload) {
        if (definition == null || definition.getPayloadRequiredKeys() == null) {
            return;
        }

        for (String key : definition.getPayloadRequiredKeys()) {
            if (key == null || key.isBlank()) {
                continue;
            }
            if (!payload.containsKey(key) || payload.get(key) == null) {
                throw new BadRequestException("Payload analytics non valido: campo obbligatorio mancante");
            }
        }
    }

    private Map<String, Object> normalizePayload(String eventName, Map<String, Object> payload) {
        Map<String, Object> normalized = payload == null ? new HashMap<>() : new HashMap<>(payload);

        if ("SESSION_DURATION".equals(eventName)) {
            Object rawDuration = normalized.get(DURATION_KEY);
            if (rawDuration == null) {
                rawDuration = normalized.get(DURATION_FALLBACK_KEY);
            }
            double durationSeconds = parseDurationSeconds(rawDuration);
            if (durationSeconds <= 0) {
                throw new BadRequestException("duration_seconds non valido");
            }
            normalized.put(DURATION_KEY, durationSeconds);
        }

        return normalized;
    }

    private double parseDurationSeconds(Object rawDuration) {
        if (rawDuration == null) {
            throw new BadRequestException("duration_seconds mancante");
        }
        if (rawDuration instanceof Number number) {
            return number.doubleValue();
        }
        if (rawDuration instanceof String text) {
            String trimmed = text.trim();
            if (trimmed.isEmpty()) {
                throw new BadRequestException("duration_seconds non valido");
            }
            try {
                return Double.parseDouble(trimmed);
            } catch (NumberFormatException ex) {
                throw new BadRequestException("duration_seconds non valido");
            }
        }
        throw new BadRequestException("duration_seconds non valido");
    }

    private Map<String, Object> toRawEventMap(AnalyticsBatchEventRequest event) {
        Map<String, Object> raw = new HashMap<>();
        raw.put("eventId", event.eventId() != null ? event.eventId().toString() : null);
        raw.put("eventName", event.eventName());
        raw.put("eventVersion", event.eventVersion());
        raw.put("idempotencyKey", event.idempotencyKey());
        raw.put("sessionId", event.sessionId() != null ? event.sessionId().toString() : null);
        raw.put("occurredAt", event.occurredAt() != null ? event.occurredAt().toString() : null);
        raw.put("route", event.route());
        raw.put("platform", event.platform());
        raw.put("appVersion", event.appVersion());
        raw.put("eventSource", event.eventSource());
        raw.put("consentAnalytics", event.consentAnalytics());
        raw.put("userAgent", event.userAgent());
        raw.put("payload", event.payload() == null ? Map.of() : event.payload());
        return raw;
    }

    private void saveIngestionError(
        UUID userId,
        String idempotencyKey,
        Map<String, Object> rawEvent,
        String errorCode,
        String errorMessage
    ) {
        AnalyticsIngestionError ingestionError = new AnalyticsIngestionError();
        ingestionError.setUserId(userId);
        ingestionError.setIdempotencyKey(normalizeBlank(idempotencyKey));
        ingestionError.setRawEvent(rawEvent);
        ingestionError.setErrorCode(errorCode);
        ingestionError.setErrorMessage(errorMessage == null ? "Errore sconosciuto" : errorMessage);
        analyticsIngestionErrorRepository.save(ingestionError);
    }

    private String normalizeEventName(String eventName) {
        String normalized = normalizeBlank(eventName);
        if (normalized == null) {
            throw new BadRequestException("Evento non valido");
        }
        return normalized.toUpperCase();
    }

    private String resolveEventSource(String eventSource) {
        String normalized = normalizeBlank(eventSource);
        if (normalized == null) {
            return "web";
        }
        return normalized;
    }

    private String normalizeBlank(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        return trimmed;
    }

    private User getUser(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        UUID userId = principal.userId();
        return userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
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

    private enum TrackingOutcome {
        ACCEPTED,
        DUPLICATE
    }
}
