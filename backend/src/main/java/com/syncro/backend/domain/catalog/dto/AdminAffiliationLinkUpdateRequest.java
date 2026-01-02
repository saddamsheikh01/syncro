package com.syncro.backend.domain.catalog.dto;

public record AdminAffiliationLinkUpdateRequest(
    String url,
    String provider
) {
}
