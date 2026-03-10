package com.syncro.backend.integration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Smoke test: verifies the Spring context loads successfully
 * and Flyway migrations V9-V17 executed correctly.
 * This validates:
 * - Flyway baseline-on-migrate with baseline-version 8
 * - V9-V17 migrations create Sprint 1 tables
 * - All Spring beans wire correctly
 */
class FlywaySchemaSmokeTest extends Sprint1IntegrationBaseTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("Spring context loads: all beans wired correctly")
    void contextLoads() {
        assertThat(mockMvc).isNotNull();
        assertThat(objectMapper).isNotNull();
        assertThat(jwtService).isNotNull();
    }

    @Test
    @DisplayName("Flyway migrations V9-V17 executed successfully")
    void flywayMigrations_executed() {
        // Query flyway_schema_history to verify migrations ran
        List<String> versions = jdbcTemplate.queryForList(
                "SELECT version FROM syncro_test.flyway_schema_history WHERE success = true ORDER BY installed_rank",
                String.class
        );

        // Baseline (version 8) + V9 through V17
        assertThat(versions).contains("8"); // baseline
        assertThat(versions).contains("9", "10", "11", "12", "13", "14", "15", "16", "17");
    }

    @Test
    @DisplayName("Sprint 1 tables exist in database after Flyway migrations")
    void sprint1Tables_exist() {
        // Verify Sprint 1 tables created by V11-V17 exist
        List<String> tables = jdbcTemplate.queryForList(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'syncro_test' ORDER BY table_name",
                String.class
        );

        // V11: funnel tables
        assertThat(tables).contains("expats_funnel_configs", "expats_anonymous_sessions", "expats_anonymous_answers");
        // V12: relocation profile + snapshots
        assertThat(tables).contains("relocation_profiles", "relocation_onboarding_snapshots");
        // V13: city dataset
        assertThat(tables).contains("relocation_city_dataset");
        // V14/V15: weight rules + city scores
        assertThat(tables).contains("relocation_weight_rules", "relocation_city_scores");
        // V16: scoring config
        assertThat(tables).contains("relocation_scoring_config");
        // V17: waiting list
        assertThat(tables).contains("relocation_city_waiting_list");
        // Base tables from init script
        assertThat(tables).contains("users", "admin_users", "user_profiles");
        // Flyway history table
        assertThat(tables).contains("flyway_schema_history");
    }
}
