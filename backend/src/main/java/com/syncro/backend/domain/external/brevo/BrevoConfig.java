package com.syncro.backend.domain.external.brevo;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.brevo")
public class BrevoConfig {

    private String apiKey;
    private String baseUrl = "https://api.brevo.com/v3";
    private int timeoutSeconds = 10;
    private String senderEmail;
    private String senderName = "Syncro";
    private long passwordResetTemplateId;
    /** Per-locale password reset template IDs (e.g. en, es, fr). Fallback: passwordResetTemplateId, then "en". */
    private Map<String, Long> passwordResetTemplateIds = new HashMap<>();
    private String passwordResetUrlBase = "https://syncroapp.it/reset-password";
    private String frontendBaseUrl = "https://syncroapp.it";
    private Map<String, Long> templateIds = new HashMap<>();

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = sanitizeEnvValue(apiKey); }
    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
    public int getTimeoutSeconds() { return timeoutSeconds; }
    public void setTimeoutSeconds(int timeoutSeconds) { this.timeoutSeconds = timeoutSeconds; }
    public String getSenderEmail() { return senderEmail; }
    public void setSenderEmail(String senderEmail) { this.senderEmail = sanitizeEnvValue(senderEmail); }
    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }
    public long getPasswordResetTemplateId() { return passwordResetTemplateId; }
    public void setPasswordResetTemplateId(long passwordResetTemplateId) { this.passwordResetTemplateId = passwordResetTemplateId; }
    public Map<String, Long> getPasswordResetTemplateIds() { return passwordResetTemplateIds; }
    public void setPasswordResetTemplateIds(Map<String, Long> passwordResetTemplateIds) {
        this.passwordResetTemplateIds = passwordResetTemplateIds != null ? passwordResetTemplateIds : new HashMap<>();
    }
    public String getPasswordResetUrlBase() { return passwordResetUrlBase; }
    public void setPasswordResetUrlBase(String passwordResetUrlBase) { this.passwordResetUrlBase = passwordResetUrlBase; }
    public String getFrontendBaseUrl() { return frontendBaseUrl; }
    public void setFrontendBaseUrl(String frontendBaseUrl) { this.frontendBaseUrl = frontendBaseUrl; }
    public Map<String, Long> getTemplateIds() { return templateIds; }
    public void setTemplateIds(Map<String, Long> templateIds) { this.templateIds = templateIds != null ? templateIds : new HashMap<>(); }

    /** Template ID for a given email type. Use this when no locale is needed (default/legacy). */
    public long getTemplateId(String emailTypeName) {
        Long id = templateIds != null ? templateIds.get(emailTypeName) : null;
        return id != null && id > 0 ? id : 0L;
    }

    /**
     * Template ID for a given email type and locale. Tries type.locale (e.g. WELCOME.es), then type (default).
     * Locale is normalized to a short code (en, es, fr, it, pt, sq).
     */
    public long getTemplateId(String emailTypeName, String locale) {
        String normalized = normalizeLocale(locale);
        if (normalized != null && !normalized.isBlank()) {
            String key = emailTypeName + "." + normalized;
            Long id = templateIds != null ? templateIds.get(key) : null;
            if (id != null && id > 0) return id;
        }
        return getTemplateId(emailTypeName);
    }

    /** Password reset template for locale. Fallback: single passwordResetTemplateId, then "en", then default. */
    public long getPasswordResetTemplateId(String locale) {
        String normalized = normalizeLocale(locale);
        if (normalized != null && passwordResetTemplateIds != null) {
            Long id = passwordResetTemplateIds.get(normalized);
            if (id != null && id > 0) return id;
            id = passwordResetTemplateIds.get("en");
            if (id != null && id > 0) return id;
        }
        return passwordResetTemplateId;
    }

    private static String normalizeLocale(String locale) {
        if (locale == null || locale.isBlank()) return null;
        String s = locale.trim().toLowerCase(Locale.ROOT);
        int dash = s.indexOf('-');
        if (dash > 0) s = s.substring(0, dash);
        return s.isBlank() ? null : s;
    }

    public boolean isConfiguredForPasswordReset() {
        return apiKey != null && !apiKey.isBlank()
            && senderEmail != null && !senderEmail.isBlank()
            && passwordResetTemplateId > 0
            && passwordResetUrlBase != null && !passwordResetUrlBase.isBlank();
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank() && senderEmail != null && !senderEmail.isBlank();
    }

    private static String sanitizeEnvValue(String value) {
        if (value == null) return null;
        value = value.trim();
        if (value.length() >= 2 && (value.startsWith("\"") && value.endsWith("\"") || value.startsWith("'") && value.endsWith("'")))
            value = value.substring(1, value.length() - 1).trim();
        return value;
    }
}
