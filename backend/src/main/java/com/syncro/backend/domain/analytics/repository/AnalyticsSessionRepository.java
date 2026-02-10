package com.syncro.backend.domain.analytics.repository;

import com.syncro.backend.domain.analytics.entity.AnalyticsSession;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnalyticsSessionRepository extends JpaRepository<AnalyticsSession, UUID> {
}
