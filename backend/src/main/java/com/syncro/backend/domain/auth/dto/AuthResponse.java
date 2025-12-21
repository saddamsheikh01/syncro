package com.syncro.backend.domain.auth.dto;

public record AuthResponse(
    UserResponse user,
    TokenResponse tokens
) {
}
