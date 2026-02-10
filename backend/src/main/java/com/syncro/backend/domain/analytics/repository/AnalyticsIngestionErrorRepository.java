package com.syncro.backend.domain.analytics.repository;

import com.syncro.backend.domain.analytics.entity.AnalyticsIngestionError;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnalyticsIngestionErrorRepository extends JpaRepository<AnalyticsIngestionError, Long> {
}
