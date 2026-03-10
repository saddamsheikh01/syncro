package com.syncro.backend.support;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Shared Testcontainers PostgreSQL configuration.
 * Uses @ServiceConnection so Spring Boot auto-configures datasource + flyway.
 * The container is reused across all integration tests (singleton pattern).
 */
@TestConfiguration(proxyBeanMethods = false)
public class TestContainersConfig {

    private static final PostgreSQLContainer POSTGRES =
            new PostgreSQLContainer("postgres:16-alpine")
                    .withDatabaseName("syncro_test_db")
                    .withUsername("test")
                    .withPassword("test")
                    .withUrlParam("stringtype", "unspecified")
                    .withInitScript("init-test-schema.sql");

    static {
        POSTGRES.start();
    }

    @Bean
    @ServiceConnection
    PostgreSQLContainer postgresContainer() {
        return POSTGRES;
    }
}
