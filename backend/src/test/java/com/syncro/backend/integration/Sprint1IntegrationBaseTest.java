package com.syncro.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncro.backend.domain.auth.entity.AdminUser;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.AdminUserRepository;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.security.JwtService;
import com.syncro.backend.support.TestContainersConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

/**
 * Base class for Sprint 1 integration tests.
 * Uses Testcontainers PostgreSQL, Flyway migrations, and real Spring context.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Import(TestContainersConfig.class)
abstract class Sprint1IntegrationBaseTest {

    @Autowired protected MockMvc mockMvc;
    @Autowired protected ObjectMapper objectMapper;
    @Autowired protected JwtService jwtService;
    @Autowired protected UserRepository userRepository;
    @Autowired protected AdminUserRepository adminUserRepository;
    @Autowired protected PasswordEncoder passwordEncoder;

    /**
     * Creates and persists a test user, returns [user, jwtToken].
     */
    protected Object[] createUserAndGetToken() {
        User user = new User();
        user.setEmail("test-" + UUID.randomUUID().toString().substring(0, 8) + "@syncro.test");
        user.setLanguage("en");
        user.setOnboardingCompleted(false);
        user.setEmailVerified(true);
        user = userRepository.save(user);

        String token = jwtService.generateUserAccessToken(user.getId());
        return new Object[]{user, token};
    }

    /**
     * Creates and persists a test admin user, returns [admin, jwtToken].
     */
    protected Object[] createAdminAndGetToken() {
        AdminUser admin = new AdminUser();
        admin.setEmail("admin-" + UUID.randomUUID().toString().substring(0, 8) + "@syncro.test");
        admin.setPassword(passwordEncoder.encode("testpassword"));
        admin = adminUserRepository.save(admin);

        String token = jwtService.generateAdminAccessToken(admin.getId(), "ADMIN");
        return new Object[]{admin, token};
    }
}
