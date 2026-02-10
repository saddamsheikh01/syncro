package com.syncro.backend.domain.analytics.service;

import java.time.LocalDate;
import java.time.ZoneOffset;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class AnalyticsKpiRefreshScheduler {

    private static final Logger logger = LoggerFactory.getLogger(AnalyticsKpiRefreshScheduler.class);
    private static final int DEFAULT_LOOKBACK_DAYS = 30;

    private final AnalyticsService analyticsService;
    private final boolean refreshEnabled;

    public AnalyticsKpiRefreshScheduler(
        AnalyticsService analyticsService,
        @Value("${app.analytics.kpi-refresh.enabled:true}") boolean refreshEnabled
    ) {
        this.analyticsService = analyticsService;
        this.refreshEnabled = refreshEnabled;
    }

    @Scheduled(
        cron = "${app.analytics.kpi-refresh.cron:0 10 2 * * *}",
        zone = "${app.analytics.kpi-refresh.zone:UTC}"
    )
    public void refreshDailyKpisWindow() {
        if (!refreshEnabled) {
            return;
        }

        LocalDate endDate = LocalDate.now(ZoneOffset.UTC);
        LocalDate startDate = endDate.minusDays(DEFAULT_LOOKBACK_DAYS);

        try {
            analyticsService.refreshDailyKpis(startDate, endDate);
        } catch (RuntimeException ex) {
            logger.error("Refresh KPI analytics fallito: {}", ex.getMessage(), ex);
        }
    }
}
