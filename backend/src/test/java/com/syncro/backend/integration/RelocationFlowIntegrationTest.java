package com.syncro.backend.integration;

import com.syncro.backend.domain.auth.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for the Relocation onboarding flow:
 * profile creation, progressive update, completion, snapshots, scoring.
 */
class RelocationFlowIntegrationTest extends Sprint1IntegrationBaseTest {

    @Test
    @DisplayName("PATCH onboarding without existing profile creates profile with defaults")
    void patchOnboarding_noProfile_createsWithDefaults() throws Exception {
        Object[] userAndToken = createUserAndGetToken();
        String jwtToken = (String) userAndToken[1];

        String body = """
                {
                    "userType": "planning_move",
                    "completedSteps": 1
                }
                """;

        mockMvc.perform(patch("/api/v1/relocation/onboarding")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userType").value("planning_move"))
                .andExpect(jsonPath("$.completedSteps").value(1))
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }

    @Test
    @DisplayName("PATCH onboarding progressively updates fields and advances steps")
    void patchOnboarding_progressiveUpdate_advancesSteps() throws Exception {
        Object[] userAndToken = createUserAndGetToken();
        String jwtToken = (String) userAndToken[1];

        // Step 1: initial
        String body1 = """
                {
                    "userType": "planning_move",
                    "household": "single",
                    "completedSteps": 2
                }
                """;

        mockMvc.perform(patch("/api/v1/relocation/onboarding")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completedSteps").value(2))
                .andExpect(jsonPath("$.household").value("single"));

        // Step 2: add more fields
        String body2 = """
                {
                    "primaryGoal": "career",
                    "socialPriority": "high",
                    "monthlyBudget": 2500,
                    "completedSteps": 5
                }
                """;

        mockMvc.perform(patch("/api/v1/relocation/onboarding")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completedSteps").value(5))
                .andExpect(jsonPath("$.completionPercent").value(50))
                .andExpect(jsonPath("$.primaryGoal").value("career"))
                .andExpect(jsonPath("$.socialPriority").value("high"));
    }

    @Test
    @DisplayName("PATCH onboarding to 10 steps sets status COMPLETED")
    void patchOnboarding_10Steps_becomesCompleted() throws Exception {
        Object[] userAndToken = createUserAndGetToken();
        String jwtToken = (String) userAndToken[1];

        String body = """
                {
                    "userType": "planning_move",
                    "household": "single",
                    "monthlyBudget": 2000,
                    "primaryGoal": "career",
                    "socialPriority": "medium",
                    "desiredLifestyle": "balanced",
                    "workStatus": "employed",
                    "priorityProblem": "monthly_costs",
                    "freeNotes": "Looking for warm climate",
                    "completedSteps": 10
                }
                """;

        mockMvc.perform(patch("/api/v1/relocation/onboarding")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.completionPercent").value(100))
                .andExpect(jsonPath("$.completedSteps").value(10));
    }

    @Test
    @DisplayName("GET activation-state returns coherent next actions for incomplete profile")
    void getActivationState_incomplete_showsCompleteOnboarding() throws Exception {
        Object[] userAndToken = createUserAndGetToken();
        String jwtToken = (String) userAndToken[1];

        // Create a partial profile
        String body = """
                {
                    "userType": "planning_move",
                    "household": "single",
                    "completedSteps": 3
                }
                """;

        mockMvc.perform(patch("/api/v1/relocation/onboarding")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        // Check activation state
        mockMvc.perform(get("/api/v1/relocation/activation-state")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.completedFields").isArray())
                .andExpect(jsonPath("$.missingFields").isArray())
                .andExpect(jsonPath("$.hasActiveSnapshot").value(false))
                .andExpect(jsonPath("$.hasScoringResults").value(false))
                .andExpect(jsonPath("$.nextActions[0].action").value("complete_onboarding"));
    }

    @Test
    @DisplayName("POST snapshot on incomplete profile returns 409 CONFLICT")
    void createSnapshot_incompleteProfile_returns409() throws Exception {
        Object[] userAndToken = createUserAndGetToken();
        String jwtToken = (String) userAndToken[1];

        // Create partial profile (not completed)
        String body = """
                {
                    "userType": "planning_move",
                    "completedSteps": 3
                }
                """;

        mockMvc.perform(patch("/api/v1/relocation/onboarding")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        // Try to create snapshot — should fail
        mockMvc.perform(post("/api/v1/relocation/onboarding/snapshots")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST snapshot on completed profile creates snapshot version 1")
    void createSnapshot_completedProfile_createsVersion1() throws Exception {
        Object[] userAndToken = createUserAndGetToken();
        String jwtToken = (String) userAndToken[1];

        // Complete profile
        String body = """
                {
                    "userType": "planning_move",
                    "household": "single",
                    "monthlyBudget": 2000,
                    "primaryGoal": "career",
                    "socialPriority": "medium",
                    "desiredLifestyle": "balanced",
                    "workStatus": "employed",
                    "priorityProblem": "monthly_costs",
                    "freeNotes": "Test notes",
                    "completedSteps": 10
                }
                """;

        mockMvc.perform(patch("/api/v1/relocation/onboarding")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        // Create snapshot
        mockMvc.perform(post("/api/v1/relocation/onboarding/snapshots")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(1))
                .andExpect(jsonPath("$.isActive").value(true))
                .andExpect(jsonPath("$.payload").isMap())
                .andExpect(jsonPath("$.payload.userType").value("planning_move"));
    }

    @Test
    @DisplayName("GET snapshots returns list of all user snapshots")
    void getSnapshots_returnsAll() throws Exception {
        Object[] userAndToken = createUserAndGetToken();
        String jwtToken = (String) userAndToken[1];

        // Complete profile and create two snapshots
        String body = """
                {
                    "userType": "planning_move",
                    "household": "single",
                    "monthlyBudget": 2000,
                    "primaryGoal": "career",
                    "socialPriority": "medium",
                    "desiredLifestyle": "balanced",
                    "workStatus": "employed",
                    "priorityProblem": "monthly_costs",
                    "freeNotes": "Test",
                    "completedSteps": 10
                }
                """;

        mockMvc.perform(patch("/api/v1/relocation/onboarding")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        // Create first snapshot
        mockMvc.perform(post("/api/v1/relocation/onboarding/snapshots")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(1));

        // Create second snapshot (first should be deactivated)
        mockMvc.perform(post("/api/v1/relocation/onboarding/snapshots")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(2));

        // GET snapshots — should return 2 ordered by version desc
        mockMvc.perform(get("/api/v1/relocation/onboarding/snapshots")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].version").value(2))
                .andExpect(jsonPath("$[0].isActive").value(true))
                .andExpect(jsonPath("$[1].version").value(1))
                .andExpect(jsonPath("$[1].isActive").value(false));
    }

    @Test
    @DisplayName("GET scoring history returns empty list when no scoring computed")
    void getScoringHistory_empty_returnsEmptyList() throws Exception {
        Object[] userAndToken = createUserAndGetToken();
        String jwtToken = (String) userAndToken[1];

        mockMvc.perform(get("/api/v1/relocation/city-scoring/history")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }
}
