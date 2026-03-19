package com.syncro.backend.integration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for security rules:
 * public access, user JWT required, admin JWT required.
 */
class SecurityIntegrationTest extends Sprint1IntegrationBaseTest {

    @Test
    @DisplayName("Public endpoints (funnel config, anonymous sessions) return 200 or 404 without JWT")
    void publicEndpoints_noJwt_accessible() throws Exception {
        // GET funnel config (public) — 404 is OK (no config seeded), NOT 401
        mockMvc.perform(get("/api/v1/expats/funnel/config")
                        .param("configKey", "test")
                        .param("language", "en"))
                .andExpect(status().isNotFound());

        // POST anonymous session (public) — should succeed
        mockMvc.perform(post("/api/v1/expats/anonymous/sessions")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Relocation endpoints without JWT return 401 UNAUTHORIZED")
    void relocationEndpoints_noJwt_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/relocation/onboarding"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(patch("/api/v1/relocation/onboarding")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userType\":\"planning_move\"}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/relocation/activation-state"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/relocation/onboarding/snapshots"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/relocation/city-scoring/history"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Admin endpoints without JWT return 401 UNAUTHORIZED")
    void adminEndpoints_noJwt_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/expats/funnel-configs"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/admin/expats/cities"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/admin/expats/weight-rules"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/admin/expats/scoring-config"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Admin GET endpoints with user JWT succeed (no role-based access control)")
    void adminGetEndpoints_userJwt_succeeds() throws Exception {
        Object[] userAndToken = createUserAndGetToken();
        String userJwt = (String) userAndToken[1];

        // Admin GET listing endpoints don't check roles — they only require authentication.
        // This verifies the current behavior: any authenticated user can access admin read endpoints.
        // NOTE: This is a known security gap — no @PreAuthorize("hasRole('ADMIN')") on admin endpoints.
        mockMvc.perform(get("/api/v1/admin/expats/weight-rules")
                        .header("Authorization", "Bearer " + userJwt))
                .andExpect(status().isOk());
    }
}
