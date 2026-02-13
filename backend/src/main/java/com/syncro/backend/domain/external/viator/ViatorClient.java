package com.syncro.backend.domain.external.viator;

import com.fasterxml.jackson.databind.JsonNode;
import com.syncro.backend.domain.external.viator.dto.ViatorFetchResult;
import com.syncro.backend.domain.external.viator.dto.ViatorProductSearchPage;
import com.syncro.backend.domain.external.viator.dto.ViatorProductsPage;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Supplier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class ViatorClient {

    private static final Logger log = LoggerFactory.getLogger(ViatorClient.class);

    private final ViatorConfig config;
    private final RestTemplate restTemplate;

    public ViatorClient(ViatorConfig config) {
        this.config = config;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        int timeoutMs = Math.max(config.getTimeoutSeconds(), 1) * 1000;
        factory.setConnectTimeout(timeoutMs);
        factory.setReadTimeout(timeoutMs);
        this.restTemplate = new RestTemplate(factory);
    }

    public ViatorFetchResult getModifiedProducts(
        String cursor,
        Instant modifiedSince,
        int count,
        String acceptLanguage
    ) {
        if (!config.isConfigured()) {
            return ViatorFetchResult.failure("Viator non configurato");
        }

        UriComponentsBuilder builder = UriComponentsBuilder
            .fromUriString(config.getBaseUrl() + "/products/modified-since")
            .queryParam("count", count);

        if (isNotBlank(cursor)) {
            builder.queryParam("cursor", cursor);
        } else if (modifiedSince != null) {
            builder.queryParam("modified-since", DateTimeFormatter.ISO_INSTANT.format(modifiedSince));
        }

        applyOptionalQueryParams(builder);

        String url = builder.build(true).toUriString();
        HttpEntity<Void> requestEntity = new HttpEntity<>(buildHeaders(acceptLanguage, false));

        try {
            ResponseEntity<JsonNode> response = executeWithRetry(
                () -> restTemplate.exchange(url, HttpMethod.GET, requestEntity, JsonNode.class),
                "GET /products/modified-since"
            );
            JsonNode body = response.getBody();
            if (body == null || !body.isObject()) {
                return ViatorFetchResult.success(new ViatorProductsPage(List.of(), null));
            }
            JsonNode productsNode = body.path("products");
            List<JsonNode> products = new ArrayList<>();
            if (productsNode.isArray()) {
                productsNode.forEach(products::add);
            }
            String nextCursor = text(body, "nextCursor");
            return ViatorFetchResult.success(new ViatorProductsPage(products, nextCursor));
        } catch (HttpClientErrorException.Forbidden ex) {
            String body = ex.getResponseBodyAsString();
            String lowered = body != null ? body.toLowerCase() : "";
            if (lowered.contains("endpoint access denied")) {
                return ViatorFetchResult.accessDenied(body);
            }
            log.error("Errore chiamata Viator modified-since (403): {}", body);
            return ViatorFetchResult.failure("403 Forbidden su /products/modified-since");
        } catch (RestClientException ex) {
            log.error("Errore chiamata Viator modified-since: {}", ex.getMessage());
            return ViatorFetchResult.failure(ex.getMessage());
        }
    }

    public List<String> getDestinationIds(String acceptLanguage, int maxItems) {
        if (!config.isConfigured()) {
            return List.of();
        }

        UriComponentsBuilder builder = UriComponentsBuilder
            .fromUriString(config.getBaseUrl() + "/destinations");
        applyOptionalQueryParams(builder);
        String url = builder.build(true).toUriString();

        HttpEntity<Void> requestEntity = new HttpEntity<>(buildHeaders(acceptLanguage, false));
        try {
            ResponseEntity<JsonNode> response = executeWithRetry(
                () -> restTemplate.exchange(url, HttpMethod.GET, requestEntity, JsonNode.class),
                "GET /destinations"
            );
            JsonNode body = response.getBody();
            if (body == null || !body.isObject()) {
                return List.of();
            }

            List<String> destinationIds = new ArrayList<>();
            JsonNode destinations = body.path("destinations");
            if (destinations.isArray()) {
                for (JsonNode destination : destinations) {
                    String destinationId = text(destination, "destinationId");
                    if (isNotBlank(destinationId)) {
                        destinationIds.add(destinationId);
                    }
                    if (destinationIds.size() >= maxItems) {
                        break;
                    }
                }
            }
            return destinationIds;
        } catch (RestClientException ex) {
            log.error("Errore chiamata Viator destinations: {}", ex.getMessage());
            return List.of();
        }
    }

    public Optional<ViatorProductSearchPage> searchProductsByDestination(
        String destinationId,
        int start,
        int count,
        String currency,
        String acceptLanguage
    ) {
        if (!config.isConfigured() || !isNotBlank(destinationId)) {
            return Optional.empty();
        }

        UriComponentsBuilder builder = UriComponentsBuilder
            .fromUriString(config.getBaseUrl() + "/products/search");
        applyOptionalQueryParams(builder);
        String url = builder.build(true).toUriString();

        int safeStart = Math.max(start, 1);
        int safeCount = Math.min(Math.max(count, 1), 50);

        Map<String, Object> payload = Map.of(
            "filtering", Map.of("destination", destinationId),
            "pagination", Map.of("start", safeStart, "count", safeCount),
            "currency", isNotBlank(currency) ? currency : "EUR"
        );

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(
            payload,
            buildHeaders(acceptLanguage, true)
        );

        try {
            ResponseEntity<JsonNode> response = executeWithRetry(
                () -> restTemplate.exchange(url, HttpMethod.POST, requestEntity, JsonNode.class),
                "POST /products/search"
            );
            JsonNode body = response.getBody();
            if (body == null || !body.isObject()) {
                return Optional.of(new ViatorProductSearchPage(List.of(), 0));
            }

            List<JsonNode> products = new ArrayList<>();
            JsonNode productsNode = body.path("products");
            if (productsNode.isArray()) {
                productsNode.forEach(products::add);
            }
            int totalCount = body.path("totalCount").asInt(0);

            return Optional.of(new ViatorProductSearchPage(products, totalCount));
        } catch (RestClientException ex) {
            log.error("Errore chiamata Viator products/search: {}", ex.getMessage());
            return Optional.empty();
        }
    }

    public List<JsonNode> getProductsBulk(List<String> productCodes, String acceptLanguage) {
        if (!config.isConfigured() || productCodes == null || productCodes.isEmpty()) {
            return List.of();
        }

        UriComponentsBuilder builder = UriComponentsBuilder
            .fromUriString(config.getBaseUrl() + "/products/bulk");
        applyOptionalQueryParams(builder);

        String url = builder.build(true).toUriString();
        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(
            Map.of("productCodes", productCodes),
            buildHeaders(acceptLanguage, true)
        );

        try {
            ResponseEntity<List<JsonNode>> response = executeWithRetry(
                () -> restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    new ParameterizedTypeReference<List<JsonNode>>() {}
                ),
                "POST /products/bulk"
            );
            List<JsonNode> body = response.getBody();
            return body != null ? body : List.of();
        } catch (RestClientException ex) {
            log.error("Errore chiamata Viator bulk: {}", ex.getMessage());
            return List.of();
        }
    }

    private HttpHeaders buildHeaders(String acceptLanguage, boolean withContentType) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("exp-api-key", config.getApiKey());
        headers.set("Accept", config.getAcceptVersion());
        headers.set("Accept-Language", isNotBlank(acceptLanguage) ? acceptLanguage : config.getDefaultLanguage());
        if (withContentType) {
            headers.setContentType(MediaType.parseMediaType(config.getAcceptVersion()));
        }
        return headers;
    }

    private void applyOptionalQueryParams(UriComponentsBuilder builder) {
        if (isNotBlank(config.getCampaignValue())) {
            builder.queryParam("campaign-value", config.getCampaignValue());
        }
        if (isNotBlank(config.getTargetLander())) {
            builder.queryParam("target-lander", config.getTargetLander());
        }
    }

    private <T> ResponseEntity<T> executeWithRetry(
        Supplier<ResponseEntity<T>> action,
        String operation
    ) {
        int maxAttempts = Math.max(config.getMaxRetries(), 0) + 1;
        long fallbackBackoffMs = Math.max(config.getRetryBackoffMillis(), 0);

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                ResponseEntity<T> response = action.get();
                if (response.getStatusCode().is2xxSuccessful()) {
                    return response;
                }
                throw new RestClientException("Unexpected status: " + response.getStatusCode());
            } catch (HttpClientErrorException.TooManyRequests ex) {
                if (attempt == maxAttempts) {
                    throw ex;
                }
                long sleepMs = retryAfterMillis(ex.getStatusCode(), ex.getResponseHeaders(), fallbackBackoffMs);
                log.warn("{} rate-limited (tentativo {}/{}), retry tra {}ms",
                    operation, attempt, maxAttempts, sleepMs);
                sleep(sleepMs);
            } catch (HttpServerErrorException | ResourceAccessException ex) {
                if (attempt == maxAttempts) {
                    throw ex;
                }
                log.warn("{} errore temporaneo (tentativo {}/{}): {}",
                    operation, attempt, maxAttempts, ex.getMessage());
                sleep(fallbackBackoffMs);
            }
        }

        throw new RestClientException(operation + " fallita dopo retry");
    }

    private long retryAfterMillis(
        HttpStatusCode statusCode,
        HttpHeaders headers,
        long fallbackBackoffMs
    ) {
        if (statusCode.value() != 429 || headers == null) {
            return fallbackBackoffMs;
        }
        String retryAfter = headers.getFirst("Retry-After");
        if (retryAfter == null) {
            return fallbackBackoffMs;
        }
        try {
            long seconds = Long.parseLong(retryAfter.trim());
            return Math.max(seconds, 1) * 1000;
        } catch (NumberFormatException ex) {
            return fallbackBackoffMs;
        }
    }

    private void sleep(long millis) {
        if (millis <= 0) {
            return;
        }
        try {
            Thread.sleep(millis);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
        }
    }

    private boolean isNotBlank(String value) {
        return value != null && !value.isBlank();
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node.path(field);
        if (value.isMissingNode() || value.isNull()) {
            return null;
        }
        String text = value.asText();
        return text != null && !text.isBlank() ? text : null;
    }
}
