package com.syncro.backend.config;

import java.util.HashMap;
import java.util.Map;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/**
 * Ensures in dev profile we never use an empty schema (avoids Hibernate/Flyway errors in console).
 * If POSTGRES_SCHEMA is empty or missing, forces syncro_dev.
 */
public class DevSchemaConfig implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    private static final String DEV_SCHEMA = "syncro_dev";

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        ConfigurableEnvironment env = applicationContext.getEnvironment();
        if (!env.acceptsProfiles(org.springframework.core.env.Profiles.of("dev"))) {
            return;
        }
        String schema = env.getProperty("POSTGRES_SCHEMA");
        if (schema == null || schema.isBlank()) {
            Map<String, Object> map = new HashMap<>();
            map.put("POSTGRES_SCHEMA", DEV_SCHEMA);
            env.getPropertySources().addFirst(new MapPropertySource("devSchemaDefault", map));
        }
    }
}
