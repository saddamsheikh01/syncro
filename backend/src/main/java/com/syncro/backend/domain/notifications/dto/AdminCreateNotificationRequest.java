package com.syncro.backend.domain.notifications.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.AssertTrue;
import java.util.Map;
import java.util.UUID;

public record AdminCreateNotificationRequest(
    @NotNull AdminNotificationTargetType targetType,
    UUID userId,
    @NotBlank @Size(max = 120) String title,
    @Size(max = 1000) String body,
    Map<String, Object> data
) {

    @AssertTrue(message = "userId è obbligatorio quando targetType=USER")
    public boolean isUserTargetValid() {
        if (targetType == null) {
            return true;
        }
        return targetType != AdminNotificationTargetType.USER || userId != null;
    }
}
