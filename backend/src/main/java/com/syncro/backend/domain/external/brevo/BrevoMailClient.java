package com.syncro.backend.domain.external.brevo;

import com.syncro.backend.common.exception.ExternalServiceException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class BrevoMailClient {

    private final BrevoConfig config;
    private final RestClient restClient;

    public BrevoMailClient(BrevoConfig config) {
        this.config = config;
        int timeoutMs = Math.max(config.getTimeoutSeconds(), 1) * 1000;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(timeoutMs);
        requestFactory.setReadTimeout(timeoutMs);
        this.restClient = RestClient.builder()
            .baseUrl(config.getBaseUrl())
            .requestFactory(requestFactory)
            .build();
    }

    public void sendPasswordResetEmail(String recipientEmail, String firstName, String rawToken) {
        sendPasswordResetEmail(recipientEmail, firstName, rawToken, null);
    }

    public void sendPasswordResetEmail(String recipientEmail, String firstName, String rawToken, String locale) {
        if (!config.isConfiguredForPasswordReset()) {
            throw new ExternalServiceException("Brevo non configurato per password reset");
        }

        long templateId = config.getPasswordResetTemplateId(locale);
        if (templateId <= 0) {
            throw new ExternalServiceException("Brevo non configurato per password reset");
        }

        String resetUrl = UriComponentsBuilder.fromUriString(config.getPasswordResetUrlBase())
            .queryParam("token", rawToken)
            .build()
            .toUriString();

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("reset_url", resetUrl);
        if (firstName != null && !firstName.isBlank()) {
            params.put("first_name", firstName);
        }

        SendTransactionalEmailRequest request = new SendTransactionalEmailRequest(
            new Sender(config.getSenderEmail(), config.getSenderName()),
            List.of(new Recipient(recipientEmail)),
            templateId,
            params
        );

        try {
            restClient.post()
                .uri("/smtp/email")
                .header("api-key", config.getApiKey())
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .header("Idempotency-Key", UUID.randomUUID().toString())
                .body(request)
                .retrieve()
                .toBodilessEntity();
        } catch (RestClientResponseException ex) {
            String body = ex.getResponseBodyAsString();
            String msg = "Brevo error: " + ex.getStatusCode() + (body != null && !body.isBlank() ? " " + body : "");
            throw new ExternalServiceException(msg, ex);
        } catch (RuntimeException ex) {
            throw new ExternalServiceException("Invio email con Brevo non riuscito", ex);
        }
    }

    public void sendTransactionalEmail(String recipientEmail, long templateId, Map<String, Object> params) {
        if (!config.isConfigured() || templateId <= 0) {
            return;
        }
        SendTransactionalEmailRequest request = new SendTransactionalEmailRequest(
            new Sender(config.getSenderEmail(), config.getSenderName()),
            List.of(new Recipient(recipientEmail)),
            templateId,
            params != null ? params : new LinkedHashMap<>()
        );
        try {
            restClient.post()
                .uri("/smtp/email")
                .header("api-key", config.getApiKey())
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .header("Idempotency-Key", UUID.randomUUID().toString())
                .body(request)
                .retrieve()
                .toBodilessEntity();
        } catch (RestClientResponseException ex) {
            String body = ex.getResponseBodyAsString();
            String msg = "Brevo error: " + ex.getStatusCode() + (body != null && !body.isBlank() ? " " + body : "");
            throw new ExternalServiceException(msg, ex);
        } catch (RuntimeException ex) {
            throw new ExternalServiceException("Failed to send email via Brevo", ex);
        }
    }

    private record SendTransactionalEmailRequest(
        Sender sender,
        List<Recipient> to,
        long templateId,
        Map<String, Object> params
    ) {
    }

    private record Sender(
        String email,
        String name
    ) {
    }

    private record Recipient(
        String email
    ) {
    }
}
