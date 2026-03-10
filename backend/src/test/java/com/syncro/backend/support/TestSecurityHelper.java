package com.syncro.backend.support;

import com.syncro.backend.domain.auth.entity.AdminUser;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.security.JwtService;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Utility for creating authenticated principals and JWT tokens in integration tests.
 */
@Component
public class TestSecurityHelper {

    private final JwtService jwtService;

    public TestSecurityHelper(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    /**
     * Creates a User entity suitable for test use. Does NOT persist it.
     */
    public static User mockUser(UUID userId) {
        User user = new User();
        user.setId(userId);
        user.setEmail("test-" + userId.toString().substring(0, 8) + "@syncro.test");
        user.setLanguage("en");
        user.setOnboardingCompleted(false);
        user.setEmailVerified(true);
        return user;
    }

    /**
     * Creates an AdminUser entity suitable for test use. Does NOT persist it.
     */
    public static AdminUser mockAdmin(UUID adminId) {
        AdminUser admin = new AdminUser();
        admin.setId(adminId);
        admin.setEmail("admin-" + adminId.toString().substring(0, 8) + "@syncro.test");
        admin.setPassword("$2a$10$dummyhash");
        return admin;
    }

    /**
     * Generates a valid JWT access token for the given user ID.
     */
    public String jwtTokenForUser(UUID userId) {
        return jwtService.generateUserAccessToken(userId);
    }

    /**
     * Generates a valid JWT access token for the given admin ID.
     */
    public String jwtTokenForAdmin(UUID adminId) {
        return jwtService.generateAdminAccessToken(adminId, "ADMIN");
    }
}
