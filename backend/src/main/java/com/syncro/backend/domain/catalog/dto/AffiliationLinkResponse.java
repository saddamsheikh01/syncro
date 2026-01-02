package com.syncro.backend.domain.catalog.dto;

import java.time.Instant;
import java.util.UUID;

public record AffiliationLinkResponse(
    UUID id,
    String url,
    String provider,
    Instant createdAt
) {
}
