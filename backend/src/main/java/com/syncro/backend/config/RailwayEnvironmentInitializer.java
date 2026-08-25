package com.syncro.backend.config;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/**
 * Maps Railway-provided variables onto the app's existing env names:
 * DATABASE_URL (postgres://) and RAILWAY_PUBLIC_DOMAIN.
 */
public class RailwayEnvironmentInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        ConfigurableEnvironment env = applicationContext.getEnvironment();
        Map<String, Object> map = new HashMap<>();

        String databaseUrl = firstRealValue(
            System.getenv("DATABASE_PRIVATE_URL"),
            System.getenv("DATABASE_URL"),
            env.getProperty("DATABASE_PRIVATE_URL"),
            env.getProperty("DATABASE_URL")
        );
        if (isUsableDatabaseUrl(databaseUrl)) {
            applyDatabaseUrl(databaseUrl, map);
        } else if (isRailwayRuntime() && !hasRealHost(env)) {
            throw new IllegalStateException(
                "Postgres is not linked. In Railway: backend service → Variables → "
                    + "Add variable reference → Postgres DATABASE_URL (or DATABASE_PRIVATE_URL)."
            );
        }

        String publicDomain = firstRealValue(
            System.getenv("RAILWAY_PUBLIC_DOMAIN"),
            env.getProperty("RAILWAY_PUBLIC_DOMAIN")
        );
        if (isBlank(env.getProperty("APP_API_BASE_URL")) && !isBlank(publicDomain)) {
            String baseUrl = "https://" + publicDomain.trim();
            map.put("APP_API_BASE_URL", baseUrl);
            map.put("app.api.base-url", baseUrl);
        }

        if (!map.isEmpty()) {
            env.getPropertySources().addFirst(new MapPropertySource("railwayEnvironment", map));
        }
    }

    private static boolean hasRealHost(ConfigurableEnvironment env) {
        return isRealHost(System.getenv("POSTGRES_HOST"))
            || isRealHost(System.getenv("PGHOST"))
            || isRealHost(env.getProperty("POSTGRES_HOST"))
            || isRealHost(env.getProperty("PGHOST"));
    }

    private static void applyDatabaseUrl(String rawUrl, Map<String, Object> map) {
        String normalized = rawUrl.trim().replace("postgres://", "postgresql://");
        URI uri = URI.create(normalized);
        String host = uri.getHost();
        if (!isRealHost(host)) {
            return;
        }

        int port = uri.getPort() > 0 ? uri.getPort() : 5432;
        String path = uri.getPath() == null ? "" : uri.getPath();
        String database = path.startsWith("/") ? path.substring(1) : path;
        int queryIdx = database.indexOf('?');
        if (queryIdx >= 0) {
            database = database.substring(0, queryIdx);
        }

        String username = "";
        String password = "";
        String userInfo = uri.getRawUserInfo();
        if (userInfo != null && !userInfo.isBlank()) {
            int colon = userInfo.indexOf(':');
            if (colon >= 0) {
                username = decode(userInfo.substring(0, colon));
                password = decode(userInfo.substring(colon + 1));
            } else {
                username = decode(userInfo);
            }
        }

        boolean privateNetwork = host.endsWith(".railway.internal");
        String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + "/" + database
            + (privateNetwork ? "" : "?sslmode=require");

        map.put("POSTGRES_HOST", host);
        map.put("PGHOST", host);
        map.put("POSTGRES_PORT", String.valueOf(port));
        map.put("PGPORT", String.valueOf(port));
        map.put("POSTGRES_DB", database);
        map.put("PGDATABASE", database);
        map.put("POSTGRES_USER", username);
        map.put("PGUSER", username);
        map.put("POSTGRES_PASSWORD", password);
        map.put("PGPASSWORD", password);
        map.put("spring.datasource.url", jdbcUrl);
        map.put("spring.datasource.username", username);
        map.put("spring.datasource.password", password);
    }

    private static boolean isRailwayRuntime() {
        return firstRealValue(
            System.getenv("RAILWAY_ENVIRONMENT"),
            System.getenv("RAILWAY_PROJECT_ID"),
            System.getenv("RAILWAY_SERVICE_ID")
        ) != null;
    }

    private static boolean isUsableDatabaseUrl(String value) {
        if (!isRealValue(value)) {
            return false;
        }
        String trimmed = value.trim().toLowerCase();
        return trimmed.startsWith("postgres://") || trimmed.startsWith("postgresql://");
    }

    private static boolean isRealHost(String value) {
        return isRealValue(value);
    }

    private static boolean isRealValue(String value) {
        if (value == null) {
            return false;
        }
        String trimmed = value.trim();
        return !trimmed.isEmpty() && !trimmed.contains("${") && !trimmed.contains("$(");
    }

    private static String firstRealValue(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (isRealValue(value)) {
                return value.trim();
            }
        }
        return null;
    }

    private static String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
