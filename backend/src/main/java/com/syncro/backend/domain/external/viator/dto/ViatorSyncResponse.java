package com.syncro.backend.domain.external.viator.dto;

import java.time.Instant;
import java.util.List;

public record ViatorSyncResponse(
    int pagesProcessed,
    int productsSeen,
    int created,
    int updated,
    int deactivated,
    int errors,
    String nextCursor,
    Instant effectiveModifiedSince,
    List<String> errorMessages,
    String message
) {}
