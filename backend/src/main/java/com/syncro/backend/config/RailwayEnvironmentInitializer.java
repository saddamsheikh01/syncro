package com.syncro.backend.config;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/**
 * Maps Railway-provided variables onto the app's existing env names:
 * DATABASE_URL (postgres:// / postgresql:// / jdbc:postgresql://) and RAILWAY_PUBLIC_DOMAIN.
 */
public class RailwayEnvironmentInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        ConfigurableEnvironment env = applicationContext.getEnvironment();
        Map<String, Object> map = new HashMap<>();

        String databaseUrl = findDatabaseUrl(env);
        if (isUsableDatabaseUrl(databaseUrl)) {
            applyDatabaseUrl(databaseUrl, map);
        } else if (!applyFromDiscreteVars(env, map) && isRailwayRuntime() && !hasRealHost(env)) {
            throw new IllegalStateException(missingPostgresMessage(env, databaseUrl));
        }

        String publicDomain = firstRealValue(
            System.getenv("RAILWAY_PUBLIC_DOMAIN"),
            envOrNull(env, "RAILWAY_PUBLIC_DOMAIN")
        );
        if (isBlank(envOrNull(env, "APP_API_BASE_URL")) && !isBlank(publicDomain)) {
            String baseUrl = "https://" + publicDomain.trim();
            map.put("APP_API_BASE_URL", baseUrl);
            map.put("app.api.base-url", baseUrl);
        }

        if (!map.isEmpty()) {
            env.getPropertySources().addFirst(new MapPropertySource("railwayEnvironment", map));
        }
    }

    private static String findDatabaseUrl(ConfigurableEnvironment env) {
        List<String> candidates = new ArrayList<>();
        addIfPresent(candidates, System.getenv("DATABASE_PRIVATE_URL"));
        addIfPresent(candidates, System.getenv("DATABASE_URL"));
        addIfPresent(candidates, System.getenv("DATABASE_PUBLIC_URL"));
        addIfPresent(candidates, System.getenv("POSTGRES_URL"));
        addIfPresent(candidates, System.getenv("SPRING_DATASOURCE_URL"));
        addIfPresent(candidates, envOrNull(env, "DATABASE_PRIVATE_URL"));
        addIfPresent(candidates, envOrNull(env, "DATABASE_URL"));
        addIfPresent(candidates, envOrNull(env, "DATABASE_PUBLIC_URL"));

        Map<String, String> processEnv = System.getenv();
        if (processEnv != null) {
            for (Map.Entry<String, String> entry : processEnv.entrySet()) {
                if (entry.getValue() == null) {
                    continue;
                }
                addIfPresent(candidates, entry.getValue());
            }
        }

        for (String candidate : candidates) {
            if (isUsableDatabaseUrl(candidate)) {
                return unwrap(candidate);
            }
        }
        return firstNonBlank(candidates);
    }

    private static boolean applyFromDiscreteVars(ConfigurableEnvironment env, Map<String, Object> map) {
        String host = firstRealValue(
            System.getenv("PGHOST"),
            System.getenv("POSTGRES_HOST"),
            envOrNull(env, "PGHOST"),
            envOrNull(env, "POSTGRES_HOST")
        );
        String database = firstRealValue(
            System.getenv("PGDATABASE"),
            System.getenv("POSTGRES_DB"),
            envOrNull(env, "PGDATABASE"),
            envOrNull(env, "POSTGRES_DB")
        );
        String username = firstRealValue(
            System.getenv("PGUSER"),
            System.getenv("POSTGRES_USER"),
            envOrNull(env, "PGUSER"),
            envOrNull(env, "POSTGRES_USER")
        );
        String password = firstRealValue(
            System.getenv("PGPASSWORD"),
            System.getenv("POSTGRES_PASSWORD"),
            envOrNull(env, "PGPASSWORD"),
            envOrNull(env, "POSTGRES_PASSWORD")
        );
        String port = firstRealValue(
            System.getenv("PGPORT"),
            System.getenv("POSTGRES_PORT"),
            envOrNull(env, "PGPORT"),
            envOrNull(env, "POSTGRES_PORT")
        );
        if (host == null || database == null || username == null) {
            return false;
        }
        applyJdbc(map, host, port != null ? port : "5432", database, username, password != null ? password : "");
        return true;
    }

    private static boolean hasRealHost(ConfigurableEnvironment env) {
        return isRealHost(System.getenv("POSTGRES_HOST"))
            || isRealHost(System.getenv("PGHOST"))
            || isRealHost(envOrNull(env, "POSTGRES_HOST"))
            || isRealHost(envOrNull(env, "PGHOST"));
    }

    private static void applyDatabaseUrl(String rawUrl, Map<String, Object> map) {
        String normalized = toPostgresqlUri(rawUrl);
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

        applyJdbc(map, host, String.valueOf(port), database, username, password);
    }

    private static void applyJdbc(
        Map<String, Object> map,
        String host,
        String port,
        String database,
        String username,
        String password
    ) {
        boolean privateNetwork = host.endsWith(".railway.internal");
        String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + "/" + database
            + (privateNetwork ? "" : "?sslmode=require");

        map.put("POSTGRES_HOST", host);
        map.put("PGHOST", host);
        map.put("POSTGRES_PORT", port);
        map.put("PGPORT", port);
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

    private static String missingPostgresMessage(ConfigurableEnvironment env, String databaseUrl) {
        StringBuilder message = new StringBuilder();
        message.append("Postgres is not linked on the BACKEND service (the GitHub/Java service, not the database). ");
        message.append("Open that service → Variables → + New Variable and paste: ");
        message.append("DATABASE_URL=postgresql://postgres:...@postgres.railway.internal:5432/railway ");
        message.append("(copy the URL from postgres-volume). ");
        message.append("Do not type ${{postgres-volume.DATABASE_URL}} as plain text unless Railway interpolates it. ");
        message.append("Seen: ");
        message.append("DATABASE_URL=").append(describeValue(System.getenv("DATABASE_URL"), envOrNull(env, "DATABASE_URL")));
        message.append(", DATABASE_PRIVATE_URL=").append(describeValue(System.getenv("DATABASE_PRIVATE_URL"), envOrNull(env, "DATABASE_PRIVATE_URL")));
        message.append(", PGHOST=").append(describeValue(System.getenv("PGHOST"), envOrNull(env, "PGHOST")));
        List<String> relatedKeys = relatedEnvKeys();
        if (!relatedKeys.isEmpty()) {
            message.append(", related keys=").append(relatedKeys);
        }
        if (databaseUrl != null && databaseUrl.contains("${")) {
            message.append(". DATABASE_URL looks like an uninterpolated template; paste the real postgresql:// URL instead.");
        }
        return message.toString();
    }

    private static String describeValue(String... values) {
        for (String value : values) {
            if (value == null || value.isBlank()) {
                continue;
            }
            String trimmed = value.trim();
            if (trimmed.contains("${")) {
                return "template";
            }
            if (isUsableDatabaseUrl(trimmed)) {
                return "postgres-url";
            }
            return "set";
        }
        return "missing";
    }

    private static List<String> relatedEnvKeys() {
        List<String> keys = new ArrayList<>();
        Map<String, String> processEnv = System.getenv();
        if (processEnv == null) {
            return keys;
        }
        for (String key : processEnv.keySet()) {
            if (key == null) {
                continue;
            }
            String upper = key.toUpperCase(Locale.ROOT);
            if (upper.contains("DATABASE")
                || upper.contains("POSTGRES")
                || upper.startsWith("PG")
                || upper.contains("DATASOURCE")) {
                keys.add(key);
            }
        }
        keys.sort(String::compareTo);
        return keys;
    }

    private static boolean isRailwayRuntime() {
        return firstRealValue(
            System.getenv("RAILWAY_ENVIRONMENT"),
            System.getenv("RAILWAY_PROJECT_ID"),
            System.getenv("RAILWAY_SERVICE_ID")
        ) != null;
    }

    private static boolean isUsableDatabaseUrl(String value) {
        String unwrapped = unwrap(value);
        if (unwrapped == null || unwrapped.isBlank()) {
            return false;
        }
        String normalized = toPostgresqlUri(unwrapped);
        if (!isRealValue(normalized)) {
            return false;
        }
        String trimmed = normalized.trim().toLowerCase(Locale.ROOT);
        return trimmed.startsWith("postgresql://");
    }

    /**
     * Never resolve {@code spring.datasource.url} here: the railway YAML value contains
     * {@code ${PGHOST}} and Spring throws if that env var is not set yet.
     */
    private static String envOrNull(ConfigurableEnvironment env, String key) {
        String fromProcess = System.getenv(key);
        if (fromProcess != null && !fromProcess.isBlank()) {
            return fromProcess;
        }
        try {
            return env.getProperty(key);
        } catch (RuntimeException ex) {
            return null;
        }
    }

    private static String unwrap(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (!trimmed.isEmpty() && trimmed.charAt(0) == '\uFEFF') {
            trimmed = trimmed.substring(1).trim();
        }
        if (trimmed.length() >= 2) {
            char start = trimmed.charAt(0);
            char end = trimmed.charAt(trimmed.length() - 1);
            if ((start == '"' && end == '"') || (start == '\'' && end == '\'')) {
                trimmed = trimmed.substring(1, trimmed.length() - 1).trim();
            }
        }
        return trimmed;
    }

    private static String toPostgresqlUri(String rawUrl) {
        String value = unwrap(rawUrl);
        if (value == null || value.isBlank()) {
            return "";
        }
        if (value.regionMatches(true, 0, "jdbc:", 0, 5)) {
            value = value.substring(5);
        }
        if (value.regionMatches(true, 0, "postgres://", 0, 11)) {
            value = "postgresql://" + value.substring("postgres://".length());
        }
        return value;
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

    private static String firstNonBlank(List<String> values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }

    private static void addIfPresent(List<String> values, String value) {
        if (value != null && !value.isBlank()) {
            values.add(value);
        }
    }

    private static String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
