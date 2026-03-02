package com.syncro.backend.domain.auth.dto;

/**
 * Response from register. Either authResponse (Google) or requiresVerification (email signup).
 * Exactly one is non-null.
 */
public record RegisterResponse(
    AuthResponse authResponse,
    RequiresVerificationResponse requiresVerification
) {
    public static RegisterResponse auth(AuthResponse auth) {
        return new RegisterResponse(auth, null);
    }

    public static RegisterResponse verification(String email) {
        return new RegisterResponse(null, RequiresVerificationResponse.of(email));
    }
}
