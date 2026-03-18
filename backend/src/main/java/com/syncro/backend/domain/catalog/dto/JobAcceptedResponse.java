package com.syncro.backend.domain.catalog.dto;

import java.util.UUID;

/**
 * Response body for 202 Accepted when experiences are being fetched in the background.
 */
public record JobAcceptedResponse(
    UUID jobId,
    String status,
    String message
) {}
