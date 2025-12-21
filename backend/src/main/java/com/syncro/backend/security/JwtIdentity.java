package com.syncro.backend.security;

import java.util.UUID;

public record JwtIdentity(
    UUID subjectId,
    SubjectType subjectType,
    String role
) {
}
