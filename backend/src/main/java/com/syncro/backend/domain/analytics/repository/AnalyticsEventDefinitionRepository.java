package com.syncro.backend.domain.analytics.repository;

import com.syncro.backend.domain.analytics.entity.AnalyticsEventDefinition;
import com.syncro.backend.domain.analytics.entity.AnalyticsEventDefinitionId;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnalyticsEventDefinitionRepository
    extends JpaRepository<AnalyticsEventDefinition, AnalyticsEventDefinitionId> {

    Optional<AnalyticsEventDefinition> findByEventNameAndEventVersionAndIsActiveTrue(
        String eventName,
        Integer eventVersion
    );
}
