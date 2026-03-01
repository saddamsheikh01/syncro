package com.syncro.backend.domain.auth.dto;

/**
 * Returned when the user must verify their email before logging in.
 * Frontend should route to the email verification screen.
 */
public record RequiresVerificationResponse(
    String email,
    boolean requiresVerification
) {
    public static RequiresVerificationResponse of(String email) {
        return new RequiresVerificationResponse(email, true);
    }
}
