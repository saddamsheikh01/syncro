package com.syncro.backend.domain.external.viator.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ViatorDestinationRefCreateRequest(
    @NotBlank(message = "destinationRef obbligatorio")
    @Size(max = 64, message = "destinationRef troppo lungo (max 64)")
    String destinationRef,

    @Size(max = 120, message = "cityName troppo lungo (max 120)")
    String cityName,

    Boolean enabled,

    @Min(value = 0, message = "sortOrder non valido")
    @Max(value = 100000, message = "sortOrder troppo alto")
    Integer sortOrder
) {
    public ViatorDestinationRefCreateRequest {
        if (enabled == null) {
            enabled = true;
        }
        if (sortOrder == null) {
            sortOrder = 100;
        }
    }
}
