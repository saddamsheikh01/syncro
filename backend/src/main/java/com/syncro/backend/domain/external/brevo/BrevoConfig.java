package com.syncro.backend.domain.external.brevo;

import java.util.HashMap;
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
    public String getPasswordResetUrlBase() { return passwordResetUrlBase; }
    public void setPasswordResetUrlBase(String passwordResetUrlBase) { this.passwordResetUrlBase = passwordResetUrlBase; }
    public String getFrontendBaseUrl() { return frontendBaseUrl; }
    public void setFrontendBaseUrl(String frontendBaseUrl) { this.frontendBaseUrl = frontendBaseUrl; }
    public Map<String, Long> getTemplateIds() { return templateIds; }
    public void setTemplateIds(Map<String, Long> templateIds) { this.templateIds = templateIds != null ? templateIds : new HashMap<>(); }

    public long getTemplateId(String emailTypeName) {
        Long id = templateIds != null ? templateIds.get(emailTypeName) : null;
        return id != null && id > 0 ? id : 0L;
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
