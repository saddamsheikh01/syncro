package com.syncro.backend.domain.analytics.entity;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;

public class AnalyticsDailyKpiId implements Serializable {

    private LocalDate metricDate;
    private String kpiName;

    public AnalyticsDailyKpiId() {
    }

    public AnalyticsDailyKpiId(LocalDate metricDate, String kpiName) {
        this.metricDate = metricDate;
        this.kpiName = kpiName;
    }

    public LocalDate getMetricDate() {
        return metricDate;
    }

    public void setMetricDate(LocalDate metricDate) {
        this.metricDate = metricDate;
    }

    public String getKpiName() {
        return kpiName;
    }

    public void setKpiName(String kpiName) {
        this.kpiName = kpiName;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof AnalyticsDailyKpiId that)) {
            return false;
        }
        return Objects.equals(metricDate, that.metricDate)
            && Objects.equals(kpiName, that.kpiName);
    }

    @Override
    public int hashCode() {
        return Objects.hash(metricDate, kpiName);
    }
}
