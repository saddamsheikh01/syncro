package com.syncro.backend.domain.external.viator;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.viator")
public class ViatorConfig {

    private String apiKey;
    private String baseUrl = "https://api.sandbox.viator.com/partner";
    private String acceptVersion = "application/json;version=2.0";
    private String defaultLanguage = "en-US";
    private int timeoutSeconds = 30;
    private int maxRetries = 3;
    private long retryBackoffMillis = 1000;
    private String campaignValue;
    private String targetLander;
    private Sync sync = new Sync();

    public static class Sync {

        private boolean enabled = false;
        private String cron = "0 */30 * * * *";
        private String zone = "UTC";
        private int defaultCount = 100;
        private int defaultMaxPages = 5;
        private int initialLookbackHours = 24;

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public String getCron() {
            return cron;
        }

        public void setCron(String cron) {
            this.cron = cron;
        }

        public String getZone() {
            return zone;
        }

        public void setZone(String zone) {
            this.zone = zone;
        }

        public int getDefaultCount() {
            return defaultCount;
        }

        public void setDefaultCount(int defaultCount) {
            this.defaultCount = defaultCount;
        }

        public int getDefaultMaxPages() {
            return defaultMaxPages;
        }

        public void setDefaultMaxPages(int defaultMaxPages) {
            this.defaultMaxPages = defaultMaxPages;
        }

        public int getInitialLookbackHours() {
            return initialLookbackHours;
        }

        public void setInitialLookbackHours(int initialLookbackHours) {
            this.initialLookbackHours = initialLookbackHours;
        }
    }

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

    public String getAcceptVersion() {
        return acceptVersion;
    }

    public void setAcceptVersion(String acceptVersion) {
        this.acceptVersion = acceptVersion;
    }

    public String getDefaultLanguage() {
        return defaultLanguage;
    }

    public void setDefaultLanguage(String defaultLanguage) {
        this.defaultLanguage = defaultLanguage;
    }

    public int getTimeoutSeconds() {
        return timeoutSeconds;
    }

    public void setTimeoutSeconds(int timeoutSeconds) {
        this.timeoutSeconds = timeoutSeconds;
    }

    public int getMaxRetries() {
        return maxRetries;
    }

    public void setMaxRetries(int maxRetries) {
        this.maxRetries = maxRetries;
    }

    public long getRetryBackoffMillis() {
        return retryBackoffMillis;
    }

    public void setRetryBackoffMillis(long retryBackoffMillis) {
        this.retryBackoffMillis = retryBackoffMillis;
    }

    public String getCampaignValue() {
        return campaignValue;
    }

    public void setCampaignValue(String campaignValue) {
        this.campaignValue = campaignValue;
    }

    public String getTargetLander() {
        return targetLander;
    }

    public void setTargetLander(String targetLander) {
        this.targetLander = targetLander;
    }

    public Sync getSync() {
        return sync;
    }

    public void setSync(Sync sync) {
        this.sync = sync;
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }
}
