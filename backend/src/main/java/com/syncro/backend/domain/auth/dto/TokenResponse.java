package com.syncro.backend.domain.auth.dto;

public record TokenResponse(
    String accessToken,
    String refreshToken,
    String tokenType,
    long accessExpiresIn,
    long refreshExpiresIn
) {
}
