package com.syncro.backend.domain.analytics.repository;

import com.syncro.backend.domain.analytics.entity.AnalyticsEvent;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AnalyticsEventRepository extends JpaRepository<AnalyticsEvent, UUID> {

    boolean existsByIdempotencyKey(String idempotencyKey);

    @Query(
        value = """
            SELECT date_trunc('day', occurred_at) AS bucket,
                   COUNT(*) AS total
            FROM analytics_events
            WHERE event_type = :eventType
              AND occurred_at >= :from
              AND occurred_at < :to
            GROUP BY bucket
            ORDER BY bucket
            """,
        nativeQuery = true
    )
    List<AnalyticsBucketCountProjection> countEventsByTypeDaily(
        @Param("eventType") String eventType,
        @Param("from") Instant from,
        @Param("to") Instant to
    );

    @Query(
        value = """
            SELECT date_trunc('week', occurred_at) AS bucket,
                   COUNT(*) AS total
            FROM analytics_events
            WHERE event_type = :eventType
              AND occurred_at >= :from
              AND occurred_at < :to
            GROUP BY bucket
            ORDER BY bucket
            """,
        nativeQuery = true
    )
    List<AnalyticsBucketCountProjection> countEventsByTypeWeekly(
        @Param("eventType") String eventType,
        @Param("from") Instant from,
        @Param("to") Instant to
    );

    @Query(
        value = """
            SELECT date_trunc('day', occurred_at) AS bucket,
                   COUNT(DISTINCT user_id) AS total
            FROM analytics_events
            WHERE user_id IS NOT NULL
              AND occurred_at >= :from
              AND occurred_at < :to
            GROUP BY bucket
            ORDER BY bucket
            """,
        nativeQuery = true
    )
    List<AnalyticsBucketCountProjection> countUniqueUsersDaily(
        @Param("from") Instant from,
        @Param("to") Instant to
    );

    @Query(
        value = """
            SELECT date_trunc('week', occurred_at) AS bucket,
                   COUNT(DISTINCT user_id) AS total
            FROM analytics_events
            WHERE user_id IS NOT NULL
              AND occurred_at >= :from
              AND occurred_at < :to
            GROUP BY bucket
            ORDER BY bucket
            """,
        nativeQuery = true
    )
    List<AnalyticsBucketCountProjection> countUniqueUsersWeekly(
        @Param("from") Instant from,
        @Param("to") Instant to
    );

    @Query(
        value = """
            SELECT COUNT(*)
            FROM (
                SELECT user_id
                FROM analytics_events
                WHERE user_id IS NOT NULL
                  AND occurred_at >= :currentFrom
                  AND occurred_at < :currentTo
                GROUP BY user_id
            ) current_users
            INNER JOIN (
                SELECT user_id
                FROM analytics_events
                WHERE user_id IS NOT NULL
                  AND occurred_at >= :previousFrom
                  AND occurred_at < :previousTo
                GROUP BY user_id
            ) previous_users ON current_users.user_id = previous_users.user_id
            """,
        nativeQuery = true
    )
    long countReturningUsers(
        @Param("currentFrom") Instant currentFrom,
        @Param("currentTo") Instant currentTo,
        @Param("previousFrom") Instant previousFrom,
        @Param("previousTo") Instant previousTo
    );

    @Query(
        value = """
            SELECT AVG((payload->>'duration_seconds')::numeric)
            FROM analytics_events
            WHERE event_type = 'SESSION_DURATION'
              AND occurred_at >= :from
              AND occurred_at < :to
            """,
        nativeQuery = true
    )
    Double averageSessionDuration(
        @Param("from") Instant from,
        @Param("to") Instant to
    );
}
