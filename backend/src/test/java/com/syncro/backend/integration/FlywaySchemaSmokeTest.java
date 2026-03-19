package com.syncro.backend.integration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Smoke test: verifies the Spring context loads successfully
 * and Flyway migrations through the current version executed correctly.
 * Expected versions must match db/README-FLYWAY.md (baseline 8, then 9..current).
 */
class FlywaySchemaSmokeTest extends Sprint1IntegrationBaseTest {

    /** Current latest migration version; update when adding a new V*.sql (see db/README-FLYWAY.md). */
    private static final int CURRENT_FLYWAY_VERSION = 25;

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
    @DisplayName("Flyway migrations V8 through current version present in schema history")
    void flywayMigrations_executed() {
        List<String> versions = jdbcTemplate.queryForList(
                "SELECT version FROM syncro_test.flyway_schema_history WHERE success = true ORDER BY installed_rank",
                String.class
        );

        assertThat(versions).contains("8"); // baseline
        for (int v = 9; v <= CURRENT_FLYWAY_VERSION; v++) {
            assertThat(versions).contains(String.valueOf(v));
        }
    }

    @Test
    @DisplayName("Sprint 1 tables exist in database after Flyway migrations")
    void sprint1Tables_exist() {
        // Sprint1 tables (V11–V20)
        List<String> tables = jdbcTemplate.queryForList(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'syncro_test' ORDER BY table_name",
                String.class
        );

        // V11 funnel
        assertThat(tables).contains("expats_funnel_configs", "expats_anonymous_sessions", "expats_anonymous_answers");
        // V12 relocation + snapshots
        assertThat(tables).contains("relocation_profiles", "relocation_onboarding_snapshots");
        // V13 city dataset
        assertThat(tables).contains("relocation_city_dataset");
        // V14 weight rules + waiting list | V15 city scores
        assertThat(tables).contains("relocation_weight_rules", "relocation_city_waiting_list", "relocation_city_scores");
        // V17 scoring config
        assertThat(tables).contains("relocation_scoring_config");
        // Base tables from init script
        assertThat(tables).contains("users", "admin_users", "user_profiles");
        // Flyway history table
        assertThat(tables).contains("flyway_schema_history");
    }
}
