package com.syncro.backend.domain.analytics.repository;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface AnalyticsDailyKpiProjection {

    LocalDate getMetricDate();

    BigDecimal getValue();
}
