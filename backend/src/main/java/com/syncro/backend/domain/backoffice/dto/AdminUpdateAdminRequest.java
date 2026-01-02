package com.syncro.backend.domain.backoffice.dto;

import com.syncro.backend.domain.auth.entity.AdminStatus;

public record AdminUpdateAdminRequest(
    AdminStatus status
) {
}
