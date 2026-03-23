package com.syncro.backend.domain.relocation.dto;

import java.util.UUID;

public record StarterKitActionResponse(
    UUID id,
    Integer actionOrder,
    String title,
    String description,
    String category
) {}
