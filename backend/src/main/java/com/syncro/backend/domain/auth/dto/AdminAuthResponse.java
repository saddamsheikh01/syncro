package com.syncro.backend.domain.auth.dto;

public record AdminAuthResponse(
    AdminUserResponse admin,
    TokenResponse tokens
) {
}
