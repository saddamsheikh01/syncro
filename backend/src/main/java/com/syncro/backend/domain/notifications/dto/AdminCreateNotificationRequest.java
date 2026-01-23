package com.syncro.backend.domain.notifications.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record AdminCreateNotificationRequest(
    @NotEmpty List<UUID> userIds,
    @NotBlank @Size(max = 120) String title,
    @Size(max = 1000) String body,
    Map<String, Object> data
) {
}
