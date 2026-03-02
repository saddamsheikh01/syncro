package com.syncro.backend.domain.auth.dto;

/**
 * Response from PATCH /users/me. When email change triggers OTP, both user (with new email, emailVerified=false)
 * and requiresVerification are set. Otherwise only user is set.
 */
public record UpdateUserResponse(
    UserResponse user,
    RequiresVerificationResponse requiresVerification
) {
    public static UpdateUserResponse user(UserResponse u) {
        return new UpdateUserResponse(u, null);
    }

    public static UpdateUserResponse verification(UserResponse updatedUser, String email) {
        return new UpdateUserResponse(updatedUser, RequiresVerificationResponse.of(email));
    }
}
