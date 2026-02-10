package com.syncro.backend.domain.analytics.repository;

import com.syncro.backend.domain.analytics.entity.AnalyticsDailyKpi;
import com.syncro.backend.domain.analytics.entity.AnalyticsDailyKpiId;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AnalyticsDailyKpiRepository extends JpaRepository<AnalyticsDailyKpi, AnalyticsDailyKpiId> {

    @Query(
        value = """
            SELECT metric_date AS metricDate,
                   value AS value
            FROM analytics_daily_kpi
            WHERE kpi_name = :kpiName
              AND metric_date >= :from
              AND metric_date <= :to
            ORDER BY metric_date
            """,
        nativeQuery = true
    )
    List<AnalyticsDailyKpiProjection> findDailyByKpiName(
        @Param("kpiName") String kpiName,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to
    );

    @Query(
        value = """
            SELECT date_trunc('week', metric_date::timestamp) AS bucket,
                   SUM(value)::bigint AS total
            FROM analytics_daily_kpi
            WHERE kpi_name = :kpiName
              AND metric_date >= :from
              AND metric_date <= :to
            GROUP BY bucket
            ORDER BY bucket
            """,
        nativeQuery = true
    )
    List<AnalyticsBucketCountProjection> findWeeklySumByKpiName(
        @Param("kpiName") String kpiName,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to
    );

    @Query(
        value = """
            SELECT AVG(value)
            FROM analytics_daily_kpi
            WHERE kpi_name = :kpiName
              AND metric_date >= :from
              AND metric_date <= :to
            """,
        nativeQuery = true
    )
    Double findAverageByKpiName(
        @Param("kpiName") String kpiName,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to
    );

    @Query(
        value = """
            SELECT COUNT(*)
            FROM analytics_daily_kpi
            WHERE metric_date >= :from
              AND metric_date <= :to
            """,
        nativeQuery = true
    )
    long countInRange(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
