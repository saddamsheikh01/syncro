package com.syncro.backend.domain.catalog.dto;

import org.springframework.data.domain.Page;

/**
 * Result of GET /experiences when source=VIATOR: either data from cache (200) or job accepted (202).
 */
public sealed interface GetExperiencesResult {

    record GetExperiencesData(Page<ExperienceSummaryResponse> page) implements GetExperiencesResult {}

    record GetExperiencesJobAccepted(JobAcceptedResponse jobAccepted) implements GetExperiencesResult {}
}
