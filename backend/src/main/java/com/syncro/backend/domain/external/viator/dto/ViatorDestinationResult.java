package com.syncro.backend.domain.external.viator.dto;

public record ViatorDestinationResult(
    String id,
    String name,
    String parentDestinationName
) {}
