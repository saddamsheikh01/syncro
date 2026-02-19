package com.syncro.backend.domain.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.auth.google")
public class GoogleAuthConfig {

    private String clientId;
    private String tokenInfoUrl = "https://oauth2.googleapis.com/tokeninfo";
    private int timeoutSeconds = 5;

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getTokenInfoUrl() {
        return tokenInfoUrl;
    }

    public void setTokenInfoUrl(String tokenInfoUrl) {
        this.tokenInfoUrl = tokenInfoUrl;
    }

    public int getTimeoutSeconds() {
        return timeoutSeconds;
    }

    public void setTimeoutSeconds(int timeoutSeconds) {
        this.timeoutSeconds = timeoutSeconds;
    }

    public boolean isConfigured() {
        return clientId != null && !clientId.isBlank();
    }
}
