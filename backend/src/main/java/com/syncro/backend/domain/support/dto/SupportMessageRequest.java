package com.syncro.backend.domain.support.dto;

import com.syncro.backend.domain.support.entity.SupportCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SupportMessageRequest(
    @NotBlank(message = "Subject is required")
    @Size(min = 1, max = 255)
    String subject,

    @NotBlank(message = "Message is required")
    @Size(min = 1, max = 4000)
    String message,

    SupportCategory category
) {
}
