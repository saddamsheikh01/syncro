package com.syncro.backend.domain.auth.dto;

/**
 * Response from login. Either authResponse or requiresVerification (email not verified).
 * Exactly one is non-null.
 */
public record LoginResponse(
    AuthResponse authResponse,
    RequiresVerificationResponse requiresVerification
) {
    public static LoginResponse auth(AuthResponse auth) {
        return new LoginResponse(auth, null);
    }

    public static LoginResponse verification(String email) {
        return new LoginResponse(null, RequiresVerificationResponse.of(email));
    }
}
