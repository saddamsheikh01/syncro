package com.syncro.backend.support;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Shared Testcontainers PostgreSQL configuration.
 * Uses @ServiceConnection so Spring Boot auto-configures datasource + flyway.
 * The container is reused across all integration tests (singleton pattern).
 * <p><b>Requires Docker</b> running and reachable from the JVM (e.g. Docker Desktop on Windows).
 * If {@code FlywaySchemaSmokeTest} fails with {@code Could not find a valid Docker environment},
 * start Docker and re-run Maven from the same environment, or set {@code DOCKER_HOST} if using a remote daemon.
 */
@TestConfiguration(proxyBeanMethods = false)
public class TestContainersConfig {

    private static final PostgreSQLContainer POSTGRES =
            new PostgreSQLContainer("postgres:16-alpine")
                    .withDatabaseName("syncro_test_db")
                    .withUsername("test")
                    .withPassword("test")
                    .withUrlParam("stringtype", "unspecified")
                    .withUrlParam("currentSchema", "syncro_test")
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
