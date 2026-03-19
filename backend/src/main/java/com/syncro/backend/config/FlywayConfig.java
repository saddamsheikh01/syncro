package com.syncro.backend.config;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.exception.FlywayValidateException;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.flyway.autoconfigure.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * On checksum mismatch (e.g. V21 file changed after it was applied), run repair
 * to align flyway_schema_history with current migration files, then migrate.
 * This allows the app to start without manually running {@code mvn flyway:repair}.
 */
@Configuration
@ConditionalOnClass(Flyway.class)
public class FlywayConfig {

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            try {
                flyway.migrate();
            } catch (FlywayValidateException e) {
                flyway.repair();
                flyway.migrate();
            }
        };
    }
}
