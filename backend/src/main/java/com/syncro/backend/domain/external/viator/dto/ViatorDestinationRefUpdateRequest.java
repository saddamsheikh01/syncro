package com.syncro.backend.domain.external.viator.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record ViatorDestinationRefUpdateRequest(
    @Size(max = 120, message = "cityName troppo lungo (max 120)")
    String cityName,

    Boolean enabled,

    @Min(value = 0, message = "sortOrder non valido")
    @Max(value = 100000, message = "sortOrder troppo alto")
    Integer sortOrder
) {}
