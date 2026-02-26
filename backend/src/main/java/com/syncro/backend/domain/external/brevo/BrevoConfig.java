package com.syncro.backend.domain.external.brevo;

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

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public int getTimeoutSeconds() {
        return timeoutSeconds;
    }

    public void setTimeoutSeconds(int timeoutSeconds) {
        this.timeoutSeconds = timeoutSeconds;
    }

    public String getSenderEmail() {
        return senderEmail;
    }

    public void setSenderEmail(String senderEmail) {
        this.senderEmail = senderEmail;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public long getPasswordResetTemplateId() {
        return passwordResetTemplateId;
    }

    public void setPasswordResetTemplateId(long passwordResetTemplateId) {
        this.passwordResetTemplateId = passwordResetTemplateId;
    }

    public String getPasswordResetUrlBase() {
        return passwordResetUrlBase;
    }

    public void setPasswordResetUrlBase(String passwordResetUrlBase) {
        this.passwordResetUrlBase = passwordResetUrlBase;
    }

    public boolean isConfiguredForPasswordReset() {
        return apiKey != null && !apiKey.isBlank()
            && senderEmail != null && !senderEmail.isBlank()
            && passwordResetTemplateId > 0
            && passwordResetUrlBase != null && !passwordResetUrlBase.isBlank();
    }
}
