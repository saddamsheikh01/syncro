package com.syncro.backend.domain.auth.service;

import jakarta.annotation.PostConstruct;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class AdminLanguagePreferenceService {

    private final JdbcTemplate jdbcTemplate;
    private final String qualifiedPreferencesTable;
    private final String qualifiedAdminUsersTable;

    public AdminLanguagePreferenceService(
        JdbcTemplate jdbcTemplate,
        @Value("${spring.jpa.properties.hibernate.default_schema:public}") String schema
    ) {
        this.jdbcTemplate = jdbcTemplate;
        String normalizedSchema = schema == null || schema.isBlank() ? "public" : schema.trim();
        this.qualifiedPreferencesTable = normalizedSchema + ".admin_user_preferences";
        this.qualifiedAdminUsersTable = normalizedSchema + ".admin_users";
    }

    @PostConstruct
    void ensureTableExists() {
        jdbcTemplate.execute(
            "CREATE TABLE IF NOT EXISTS " + qualifiedPreferencesTable + " ("
                + "admin_id UUID PRIMARY KEY REFERENCES " + qualifiedAdminUsersTable + "(id) ON DELETE CASCADE,"
                + "language VARCHAR(10) NOT NULL,"
                + "updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()"
                + ")"
        );
    }

    public String getLanguage(UUID adminId) {
        if (adminId == null) {
            return null;
        }
        return jdbcTemplate.query(
            "SELECT language FROM " + qualifiedPreferencesTable + " WHERE admin_id = ?",
            (rs, rowNum) -> rs.getString("language"),
            adminId
        ).stream().findFirst().orElse(null);
    }

    public void setLanguage(UUID adminId, String language) {
        if (adminId == null || language == null || language.isBlank()) {
            return;
        }
        jdbcTemplate.update(
            "INSERT INTO " + qualifiedPreferencesTable + " (admin_id, language, updated_at) VALUES (?, ?, NOW()) "
                + "ON CONFLICT (admin_id) DO UPDATE SET language = EXCLUDED.language, updated_at = NOW()",
            adminId,
            language
        );
    }
}
