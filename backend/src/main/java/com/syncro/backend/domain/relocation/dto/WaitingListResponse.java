package com.syncro.backend.domain.relocation.dto;

import java.time.Instant;
import java.util.UUID;

public record WaitingListResponse(
        UUID id,
        String email,
        String cityName,
        Boolean notified,
        Instant createdAt
) {}
