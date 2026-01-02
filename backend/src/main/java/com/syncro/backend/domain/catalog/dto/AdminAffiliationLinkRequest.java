package com.syncro.backend.domain.catalog.dto;

import jakarta.validation.constraints.NotBlank;

public record AdminAffiliationLinkRequest(
    @NotBlank String url,
    String provider
) {
}
