package com.syncro.backend.domain.analytics.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.analytics.dto.AnalyticsBatchEventRequest;
import com.syncro.backend.domain.analytics.dto.AnalyticsBatchRequest;
import com.syncro.backend.domain.analytics.dto.AnalyticsBatchResponse;
import com.syncro.backend.domain.analytics.dto.AnalyticsEventRequest;
import com.syncro.backend.domain.analytics.dto.AnalyticsKpiResponse;
import com.syncro.backend.domain.analytics.dto.AnalyticsSegmentCountResponse;
import com.syncro.backend.domain.analytics.dto.AdminUserAnalyticsResponse;
import com.syncro.backend.domain.analytics.dto.AdminUserFeatureUsageResponse;
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
import com.syncro.backend.domain.tests.repository.TestDefinitionRepository;
import com.syncro.backend.security.AdminPrincipal;
import com.syncro.backend.security.UserPrincipal;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
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
    private static final int MAX_USERS_PAGE_SIZE = 100;
    private static final int DISTRIBUTION_LIMIT = 10;
    private static final int PROFILE_COMPLETION_SECTIONS = 5;

    private final AnalyticsEventRepository analyticsEventRepository;
    private final AnalyticsEventDefinitionRepository analyticsEventDefinitionRepository;
    private final AnalyticsIngestionErrorRepository analyticsIngestionErrorRepository;
    private final AnalyticsSessionRepository analyticsSessionRepository;
    private final AnalyticsDailyKpiRepository analyticsDailyKpiRepository;
    private final UserRepository userRepository;
    private final TestDefinitionRepository testDefinitionRepository;
    private final JdbcTemplate jdbcTemplate;

    public AnalyticsService(
        AnalyticsEventRepository analyticsEventRepository,
        AnalyticsEventDefinitionRepository analyticsEventDefinitionRepository,
        AnalyticsIngestionErrorRepository analyticsIngestionErrorRepository,
        AnalyticsSessionRepository analyticsSessionRepository,
        AnalyticsDailyKpiRepository analyticsDailyKpiRepository,
        UserRepository userRepository,
        TestDefinitionRepository testDefinitionRepository,
        JdbcTemplate jdbcTemplate
    ) {
        this.analyticsEventRepository = analyticsEventRepository;
        this.analyticsEventDefinitionRepository = analyticsEventDefinitionRepository;
        this.analyticsIngestionErrorRepository = analyticsIngestionErrorRepository;
        this.analyticsSessionRepository = analyticsSessionRepository;
        this.analyticsDailyKpiRepository = analyticsDailyKpiRepository;
        this.userRepository = userRepository;
        this.testDefinitionRepository = testDefinitionRepository;
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
        long onboardingCompletedUsersTotal = userRepository.countByOnboardingCompletedTrue();

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
        List<AnalyticsSegmentCountResponse> countryDistribution = loadCountryDistribution(fromInstant, toInstant);
        List<AnalyticsSegmentCountResponse> cityDistribution = loadCityDistribution(fromInstant, toInstant);
        List<AnalyticsSegmentCountResponse> genderDistribution = loadGenderDistribution(fromInstant, toInstant);
        List<AnalyticsSegmentCountResponse> ageDistribution = loadAgeDistribution(fromInstant, toInstant);

        return new AnalyticsKpiResponse(
            registrationsDaily,
            registrationsWeekly,
            onboardingDaily,
            onboardingWeekly,
            onboardingCompletedUsersTotal,
            activeUsersDaily,
            activeUsersWeekly,
            returningUsers,
            matchSectionOpenedDaily,
            profileViewedDaily,
            mapOpenedDaily,
            averageSessionDurationSeconds,
            countryDistribution,
            cityDistribution,
            genderDistribution,
            ageDistribution
        );
    }

    @Transactional(readOnly = true)
    public Page<AdminUserFeatureUsageResponse> getUsersFeatureUsage(
        AdminPrincipal principal,
        LocalDate from,
        LocalDate to,
        String q,
        int page,
        int size
    ) {
        ensureAdmin(principal);
        LocalDate endDate = to != null ? to : LocalDate.now(ZoneOffset.UTC);
        LocalDate startDate = from != null ? from : endDate.minusDays(DEFAULT_RANGE_DAYS);
        if (startDate.isAfter(endDate)) {
            throw new BadRequestException("Intervallo date non valido");
        }

        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, MAX_USERS_PAGE_SIZE));
        Instant fromInstant = startDate.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant toInstant = endDate.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        Timestamp fromTimestamp = Timestamp.from(fromInstant);
        Timestamp toTimestamp = Timestamp.from(toInstant);
        String normalizedQuery = normalizeSearchQuery(q);
        String likeQuery = normalizedQuery == null ? null : "%" + normalizedQuery + "%";

        Long totalElements = jdbcTemplate.queryForObject(
            """
                select count(*)
                from users u
                left join user_profiles up on up.user_id = u.id
                where (?::text is null
                  or lower(coalesce(u.email, '')) like ?
                  or lower(coalesce(u.username, '')) like ?
                  or lower(coalesce(up.full_name, '')) like ?)
                """,
            Long.class,
            normalizedQuery,
            likeQuery,
            likeQuery,
            likeQuery
        );
        long total = totalElements != null ? totalElements : 0L;
        if (total == 0L) {
            return Page.empty(PageRequest.of(safePage, safeSize));
        }

        long testsRequired = Math.max(testDefinitionRepository.countByActiveTrue(), 0L);

        List<AdminUserFeatureUsageResponse> rows = jdbcTemplate.query(
            """
                with filtered_users as (
                    select
                        u.id,
                        u.email,
                        u.username,
                        u.onboarding_completed,
                        u.created_at,
                        up.full_name,
                        up.country,
                        up.city,
                        up.gender,
                        up.birth_date,
                        (
                            nullif(trim(up.full_name), '') is not null
                            and nullif(trim(up.city), '') is not null
                            and nullif(trim(up.country), '') is not null
                        ) as has_profile,
                        (
                            pref.user_id is not null
                            and (
                                coalesce(pref.matchmaking_filters, '{}'::jsonb) <> '{}'::jsonb
                                or coalesce(pref.feed_preferences, '{}'::jsonb) <> '{}'::jsonb
                                or coalesce(pref.privacy_policy_accepted, false)
                                or coalesce(pref.newsletter_consent, false)
                            )
                        ) as has_preferences,
                        (pos.user_id is not null and pos.latitude is not null and pos.longitude is not null) as has_position
                    from users u
                    left join user_profiles up on up.user_id = u.id
                    left join user_preferences pref on pref.user_id = u.id
                    left join user_positions pos on pos.user_id = u.id
                    where (?::text is null
                      or lower(coalesce(u.email, '')) like ?
                      or lower(coalesce(u.username, '')) like ?
                      or lower(coalesce(up.full_name, '')) like ?)
                ),
                event_counts as (
                    select
                        e.user_id,
                        count(*) filter (where e.event_type = 'CHAT_MESSAGE_SENT') as chat_uses,
                        count(*) filter (
                            where e.event_type in (
                                'MAP_OPENED',
                                'MAP_SEARCH_LOCATION_SELECTED',
                                'MAP_PLACE_SELECTED',
                                'MAP_DIRECTIONS_OPENED',
                                'MAP_FILTER_TOGGLED'
                            )
                        ) as map_uses,
                        count(*) filter (where e.event_type in ('MATCH_SECTION_OPENED', 'MATCH_CARD_OPENED')) as match_uses,
                        count(*) filter (where e.event_type = 'POST_CREATED') as moments_uses
                    from analytics_events e
                    where e.user_id is not null
                      and e.occurred_at >= ?
                      and e.occurred_at < ?
                      and e.event_type in (
                          'CHAT_MESSAGE_SENT',
                          'MAP_OPENED',
                          'MAP_SEARCH_LOCATION_SELECTED',
                          'MAP_PLACE_SELECTED',
                          'MAP_DIRECTIONS_OPENED',
                          'MAP_FILTER_TOGGLED',
                          'MATCH_SECTION_OPENED',
                          'MATCH_CARD_OPENED',
                          'POST_CREATED'
                      )
                    group by e.user_id
                ),
                interests_counts as (
                    select ui.user_id, count(*) as interests_count
                    from user_interests ui
                    group by ui.user_id
                ),
                tests_counts as (
                    select uts.user_id, count(distinct uts.test_id) as tests_completed
                    from user_test_submissions uts
                    group by uts.user_id
                )
                select
                    fu.id,
                    fu.email,
                    fu.username,
                    fu.full_name,
                    fu.country,
                    fu.city,
                    fu.gender,
                    case
                        when fu.birth_date is null then null
                        else extract(year from age(current_date, fu.birth_date))::int
                    end as age,
                    fu.onboarding_completed,
                    fu.has_profile,
                    fu.has_preferences,
                    fu.has_position,
                    coalesce(ec.chat_uses, 0) as chat_uses,
                    coalesce(ec.map_uses, 0) as map_uses,
                    coalesce(ec.match_uses, 0) as match_uses,
                    coalesce(ec.moments_uses, 0) as moments_uses,
                    coalesce(ic.interests_count, 0) as interests_count,
                    coalesce(tc.tests_completed, 0) as tests_completed
                from filtered_users fu
                left join event_counts ec on ec.user_id = fu.id
                left join interests_counts ic on ic.user_id = fu.id
                left join tests_counts tc on tc.user_id = fu.id
                order by fu.created_at desc, fu.id desc
                limit ? offset ?
                """,
            (rs, rowNum) -> {
                boolean hasProfile = rs.getBoolean("has_profile");
                boolean hasPreferences = rs.getBoolean("has_preferences");
                boolean hasPosition = rs.getBoolean("has_position");
                long interestsCount = rs.getLong("interests_count");
                long testsCompleted = rs.getLong("tests_completed");
                boolean hasInterests = interestsCount > 0;
                boolean hasTests = testsRequired == 0L || testsCompleted >= testsRequired;

                List<String> missingSections = new ArrayList<>();
                if (!hasProfile) {
                    missingSections.add("profile");
                }
                if (!hasPreferences) {
                    missingSections.add("preferences");
                }
                if (!hasPosition) {
                    missingSections.add("position");
                }
                if (!hasInterests) {
                    missingSections.add("interests");
                }
                if (!hasTests) {
                    missingSections.add("tests");
                }

                int completedSections = PROFILE_COMPLETION_SECTIONS - missingSections.size();
                int profileCompletionPercent = (int) Math.round((completedSections * 100.0) / PROFILE_COMPLETION_SECTIONS);
                Integer age = (Integer) rs.getObject("age");
                if (age != null && age < 0) {
                    age = null;
                }
                String username = normalizeBlank(rs.getString("username"));
                String fullName = normalizeBlank(rs.getString("full_name"));

                return new AdminUserFeatureUsageResponse(
                    rs.getObject("id", UUID.class),
                    normalizeBlank(rs.getString("email")),
                    username,
                    fullName != null ? fullName : username,
                    normalizeBlank(rs.getString("country")),
                    normalizeBlank(rs.getString("city")),
                    normalizeBlank(rs.getString("gender")),
                    age,
                    rs.getBoolean("onboarding_completed"),
                    rs.getLong("chat_uses"),
                    rs.getLong("map_uses"),
                    rs.getLong("match_uses"),
                    rs.getLong("moments_uses"),
                    interestsCount,
                    testsCompleted,
                    testsRequired,
                    missingSections.isEmpty(),
                    profileCompletionPercent,
                    List.copyOf(missingSections)
                );
            },
            normalizedQuery,
            likeQuery,
            likeQuery,
            likeQuery,
            fromTimestamp,
            toTimestamp,
            safeSize,
            (long) safePage * safeSize
        );

        return new PageImpl<>(rows, PageRequest.of(safePage, safeSize), total);
    }

    @Transactional(readOnly = true)
    public AdminUserAnalyticsResponse getUserAnalytics(
        AdminPrincipal principal,
        UUID userId,
        LocalDate from,
        LocalDate to
    ) {
        ensureAdmin(principal);
        if (userId == null) {
            throw new BadRequestException("Utente non valido");
        }

        LocalDate endDate = to != null ? to : LocalDate.now(ZoneOffset.UTC);
        LocalDate startDate = from != null ? from : endDate.minusDays(DEFAULT_RANGE_DAYS);
        if (startDate.isAfter(endDate)) {
            throw new BadRequestException("Intervallo date non valido");
        }

        Instant fromInstant = startDate.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant toInstant = endDate.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        Timestamp fromTimestamp = Timestamp.from(fromInstant);
        Timestamp toTimestamp = Timestamp.from(toInstant);
        long testsRequired = Math.max(testDefinitionRepository.countByActiveTrue(), 0L);

        List<AdminUserAnalyticsResponse> rows = jdbcTemplate.query(
            """
                select
                    u.id,
                    u.email,
                    u.username,
                    u.onboarding_completed,
                    up.full_name,
                    up.country,
                    up.city,
                    up.gender,
                    case
                        when up.birth_date is null then null
                        else extract(year from age(current_date, up.birth_date))::int
                    end as age,
                    (
                        nullif(trim(up.full_name), '') is not null
                        and nullif(trim(up.city), '') is not null
                        and nullif(trim(up.country), '') is not null
                    ) as has_profile,
                    (
                        pref.user_id is not null
                        and (
                            coalesce(pref.matchmaking_filters, '{}'::jsonb) <> '{}'::jsonb
                            or coalesce(pref.feed_preferences, '{}'::jsonb) <> '{}'::jsonb
                            or coalesce(pref.privacy_policy_accepted, false)
                            or coalesce(pref.newsletter_consent, false)
                        )
                    ) as has_preferences,
                    (pos.user_id is not null and pos.latitude is not null and pos.longitude is not null) as has_position,
                    coalesce(ic.interests_count, 0) as interests_count,
                    coalesce(tc.tests_completed, 0) as tests_completed
                from users u
                left join user_profiles up on up.user_id = u.id
                left join user_preferences pref on pref.user_id = u.id
                left join user_positions pos on pos.user_id = u.id
                left join (
                    select ui.user_id, count(*) as interests_count
                    from user_interests ui
                    group by ui.user_id
                ) ic on ic.user_id = u.id
                left join (
                    select uts.user_id, count(distinct uts.test_id) as tests_completed
                    from user_test_submissions uts
                    group by uts.user_id
                ) tc on tc.user_id = u.id
                where u.id = ?
                """,
            (rs, rowNum) -> {
                boolean hasProfile = rs.getBoolean("has_profile");
                boolean hasPreferences = rs.getBoolean("has_preferences");
                boolean hasPosition = rs.getBoolean("has_position");
                long interestsCount = rs.getLong("interests_count");
                long testsCompleted = rs.getLong("tests_completed");
                boolean hasInterests = interestsCount > 0;
                boolean hasTests = testsRequired == 0L || testsCompleted >= testsRequired;

                List<String> missingSections = new ArrayList<>();
                if (!hasProfile) {
                    missingSections.add("profile");
                }
                if (!hasPreferences) {
                    missingSections.add("preferences");
                }
                if (!hasPosition) {
                    missingSections.add("position");
                }
                if (!hasInterests) {
                    missingSections.add("interests");
                }
                if (!hasTests) {
                    missingSections.add("tests");
                }

                int completedSections = PROFILE_COMPLETION_SECTIONS - missingSections.size();
                int profileCompletionPercent = (int) Math.round((completedSections * 100.0) / PROFILE_COMPLETION_SECTIONS);
                Integer age = (Integer) rs.getObject("age");
                if (age != null && age < 0) {
                    age = null;
                }
                String username = normalizeBlank(rs.getString("username"));
                String fullName = normalizeBlank(rs.getString("full_name"));

                return new AdminUserAnalyticsResponse(
                    rs.getObject("id", UUID.class),
                    normalizeBlank(rs.getString("email")),
                    username,
                    fullName != null ? fullName : username,
                    rs.getBoolean("onboarding_completed"),
                    normalizeBlank(rs.getString("country")),
                    normalizeBlank(rs.getString("city")),
                    normalizeBlank(rs.getString("gender")),
                    age,
                    0L,
                    0L,
                    0L,
                    0L,
                    interestsCount,
                    testsCompleted,
                    testsRequired,
                    missingSections.isEmpty(),
                    profileCompletionPercent,
                    List.copyOf(missingSections),
                    List.of(),
                    List.of(),
                    List.of(),
                    List.of()
                );
            },
            userId
        );

        if (rows.isEmpty()) {
            throw new NotFoundException("Utente non trovato");
        }

        AdminUserAnalyticsResponse base = rows.getFirst();
        Map<String, List<KpiPoint>> byFeature = new LinkedHashMap<>();
        byFeature.put("chat", new ArrayList<>());
        byFeature.put("map", new ArrayList<>());
        byFeature.put("match", new ArrayList<>());
        byFeature.put("moments", new ArrayList<>());

        jdbcTemplate.query(
            """
                select
                    date_trunc('day', occurred_at) as bucket,
                    case
                        when event_type = 'CHAT_MESSAGE_SENT' then 'chat'
                        when event_type in (
                            'MAP_OPENED',
                            'MAP_SEARCH_LOCATION_SELECTED',
                            'MAP_PLACE_SELECTED',
                            'MAP_DIRECTIONS_OPENED',
                            'MAP_FILTER_TOGGLED'
                        ) then 'map'
                        when event_type in ('MATCH_SECTION_OPENED', 'MATCH_CARD_OPENED') then 'match'
                        when event_type = 'POST_CREATED' then 'moments'
                        else null
                    end as feature,
                    count(*) as total
                from analytics_events
                where user_id = ?
                  and occurred_at >= ?
                  and occurred_at < ?
                  and event_type in (
                      'CHAT_MESSAGE_SENT',
                      'MAP_OPENED',
                      'MAP_SEARCH_LOCATION_SELECTED',
                      'MAP_PLACE_SELECTED',
                      'MAP_DIRECTIONS_OPENED',
                      'MAP_FILTER_TOGGLED',
                      'MATCH_SECTION_OPENED',
                      'MATCH_CARD_OPENED',
                      'POST_CREATED'
                  )
                group by bucket, feature
                order by bucket asc
                """,
            rs -> {
                String feature = rs.getString("feature");
                if (feature == null || !byFeature.containsKey(feature)) {
                    return;
                }
                Instant bucket = rs.getTimestamp("bucket").toInstant();
                long total = rs.getLong("total");
                byFeature.get(feature).add(new KpiPoint(bucket, total));
            },
            userId,
            fromTimestamp,
            toTimestamp
        );

        List<KpiPoint> chatDaily = List.copyOf(byFeature.get("chat"));
        List<KpiPoint> mapDaily = List.copyOf(byFeature.get("map"));
        List<KpiPoint> matchDaily = List.copyOf(byFeature.get("match"));
        List<KpiPoint> momentsDaily = List.copyOf(byFeature.get("moments"));

        long chatUses = sumKpiValues(chatDaily);
        long mapUses = sumKpiValues(mapDaily);
        long matchUses = sumKpiValues(matchDaily);
        long momentsUses = sumKpiValues(momentsDaily);

        return new AdminUserAnalyticsResponse(
            base.userId(),
            base.email(),
            base.username(),
            base.fullName(),
            base.onboardingCompleted(),
            base.country(),
            base.city(),
            base.gender(),
            base.age(),
            chatUses,
            mapUses,
            matchUses,
            momentsUses,
            base.interestsCount(),
            base.testsCompleted(),
            base.testsRequired(),
            base.profileCompleted(),
            base.profileCompletionPercent(),
            base.missingSections(),
            chatDaily,
            mapDaily,
            matchDaily,
            momentsDaily
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

    private List<AnalyticsSegmentCountResponse> loadCountryDistribution(Instant from, Instant to) {
        return jdbcTemplate.query(
            """
                select
                    coalesce(nullif(trim(up.country), ''), 'Unknown') as label,
                    count(*) as total
                from users u
                left join user_profiles up on up.user_id = u.id
                where u.created_at >= ?
                  and u.created_at < ?
                group by label
                order by total desc, label asc
                limit ?
            """,
            (rs, rowNum) -> new AnalyticsSegmentCountResponse(rs.getString("label"), rs.getLong("total")),
            Timestamp.from(from),
            Timestamp.from(to),
            DISTRIBUTION_LIMIT
        );
    }

    private List<AnalyticsSegmentCountResponse> loadCityDistribution(Instant from, Instant to) {
        return jdbcTemplate.query(
            """
                select
                    coalesce(nullif(trim(up.city), ''), 'Unknown') as label,
                    count(*) as total
                from users u
                left join user_profiles up on up.user_id = u.id
                where u.created_at >= ?
                  and u.created_at < ?
                group by label
                order by total desc, label asc
                limit ?
            """,
            (rs, rowNum) -> new AnalyticsSegmentCountResponse(rs.getString("label"), rs.getLong("total")),
            Timestamp.from(from),
            Timestamp.from(to),
            DISTRIBUTION_LIMIT
        );
    }

    private List<AnalyticsSegmentCountResponse> loadGenderDistribution(Instant from, Instant to) {
        return jdbcTemplate.query(
            """
                select
                    coalesce(nullif(trim(up.gender), ''), 'UNKNOWN') as label,
                    count(*) as total
                from users u
                left join user_profiles up on up.user_id = u.id
                where u.created_at >= ?
                  and u.created_at < ?
                group by label
                order by total desc, label asc
                limit ?
            """,
            (rs, rowNum) -> new AnalyticsSegmentCountResponse(rs.getString("label"), rs.getLong("total")),
            Timestamp.from(from),
            Timestamp.from(to),
            DISTRIBUTION_LIMIT
        );
    }

    private List<AnalyticsSegmentCountResponse> loadAgeDistribution(Instant from, Instant to) {
        return jdbcTemplate.query(
            """
                select label, count(*) as total
                from (
                    select
                        case
                            when up.birth_date is null then 'Unknown'
                            when extract(year from age(current_date, up.birth_date)) < 18 then '<18'
                            when extract(year from age(current_date, up.birth_date)) between 18 and 24 then '18-24'
                            when extract(year from age(current_date, up.birth_date)) between 25 and 34 then '25-34'
                            when extract(year from age(current_date, up.birth_date)) between 35 and 44 then '35-44'
                            when extract(year from age(current_date, up.birth_date)) between 45 and 54 then '45-54'
                            else '55+'
                        end as label
                    from users u
                    left join user_profiles up on up.user_id = u.id
                    where u.created_at >= ?
                      and u.created_at < ?
                ) age_groups
                group by label
                order by case label
                    when '<18' then 1
                    when '18-24' then 2
                    when '25-34' then 3
                    when '35-44' then 4
                    when '45-54' then 5
                    when '55+' then 6
                    else 7
                end
            """,
            (rs, rowNum) -> new AnalyticsSegmentCountResponse(rs.getString("label"), rs.getLong("total")),
            Timestamp.from(from),
            Timestamp.from(to)
        );
    }

    private long sumKpiValues(List<KpiPoint> points) {
        return points.stream().mapToLong(KpiPoint::value).sum();
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

    private String normalizeSearchQuery(String value) {
        String normalized = normalizeBlank(value);
        return normalized == null ? null : normalized.toLowerCase();
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
