package com.syncro.backend.domain.analytics.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.analytics.dto.AnalyticsEventRequest;
import com.syncro.backend.domain.analytics.dto.AnalyticsKpiResponse;
import com.syncro.backend.domain.analytics.dto.KpiPoint;
import com.syncro.backend.domain.analytics.entity.AnalyticsEvent;
import com.syncro.backend.domain.analytics.entity.AnalyticsEventType;
import com.syncro.backend.domain.analytics.repository.AnalyticsBucketCountProjection;
import com.syncro.backend.domain.analytics.repository.AnalyticsEventRepository;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AnalyticsService {

    private static final int DEFAULT_RANGE_DAYS = 30;
    private static final int WEEK_DAYS = 7;
    private static final String DURATION_KEY = "duration_seconds";
    private static final String DURATION_FALLBACK_KEY = "durationSeconds";

    private final AnalyticsEventRepository analyticsEventRepository;
    private final UserRepository userRepository;

    public AnalyticsService(
        AnalyticsEventRepository analyticsEventRepository,
        UserRepository userRepository
    ) {
        this.analyticsEventRepository = analyticsEventRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void trackEvent(UserPrincipal principal, AnalyticsEventRequest request) {
        User user = getUser(principal);
        AnalyticsEventType eventType = request.eventType();
        if (eventType == null) {
            throw new BadRequestException("Evento non valido");
        }
        Map<String, Object> payload = normalizePayload(eventType, request.payload());

        AnalyticsEvent event = new AnalyticsEvent();
        event.setUser(user);
        event.setEventType(eventType);
        event.setPayload(payload);
        analyticsEventRepository.save(event);
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

        List<KpiPoint> registrationsDaily = mapBuckets(analyticsEventRepository.countEventsByTypeDaily(
            AnalyticsEventType.USER_REGISTERED.name(),
            fromInstant,
            toInstant
        ));
        List<KpiPoint> registrationsWeekly = mapBuckets(analyticsEventRepository.countEventsByTypeWeekly(
            AnalyticsEventType.USER_REGISTERED.name(),
            fromInstant,
            toInstant
        ));
        List<KpiPoint> onboardingDaily = mapBuckets(analyticsEventRepository.countEventsByTypeDaily(
            AnalyticsEventType.ONBOARDING_COMPLETED.name(),
            fromInstant,
            toInstant
        ));
        List<KpiPoint> onboardingWeekly = mapBuckets(analyticsEventRepository.countEventsByTypeWeekly(
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
        List<KpiPoint> matchSectionOpenedDaily = mapBuckets(analyticsEventRepository.countEventsByTypeDaily(
            AnalyticsEventType.MATCH_SECTION_OPENED.name(),
            fromInstant,
            toInstant
        ));
        List<KpiPoint> profileViewedDaily = mapBuckets(analyticsEventRepository.countEventsByTypeDaily(
            AnalyticsEventType.PROFILE_VIEWED.name(),
            fromInstant,
            toInstant
        ));
        List<KpiPoint> mapOpenedDaily = mapBuckets(analyticsEventRepository.countEventsByTypeDaily(
            AnalyticsEventType.MAP_OPENED.name(),
            fromInstant,
            toInstant
        ));

        long returningUsers = computeReturningUsers(endDate);
        double averageSessionDurationSeconds = resolveAverageSessionDuration(fromInstant, toInstant);

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

    private long computeReturningUsers(LocalDate endDate) {
        LocalDate currentStart = endDate.minusDays(WEEK_DAYS - 1L);
        Instant currentFrom = currentStart.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant currentTo = endDate.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant previousFrom = currentStart.minusDays(WEEK_DAYS).atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant previousTo = currentStart.atStartOfDay(ZoneOffset.UTC).toInstant();
        return analyticsEventRepository.countReturningUsers(currentFrom, currentTo, previousFrom, previousTo);
    }

    private double resolveAverageSessionDuration(Instant from, Instant to) {
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

    private Map<String, Object> normalizePayload(AnalyticsEventType eventType, Map<String, Object> payload) {
        Map<String, Object> normalized = payload == null ? new HashMap<>() : new HashMap<>(payload);
        if (eventType == AnalyticsEventType.SESSION_DURATION) {
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
}
