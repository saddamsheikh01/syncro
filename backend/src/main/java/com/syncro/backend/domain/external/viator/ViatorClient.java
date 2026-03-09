package com.syncro.backend.domain.external.viator;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncro.backend.domain.external.viator.dto.ViatorDestinationResult;
import com.syncro.backend.domain.external.viator.dto.ViatorProductSearchByTermResult;
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
    private final ObjectMapper objectMapper;
    private volatile boolean bulkEndpointDenied = false;

    public ViatorClient(ViatorConfig config, ObjectMapper objectMapper) {
        this.config = config;
        this.objectMapper = objectMapper;
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
            ResponseEntity<String> response = executeWithRetry(
                () -> restTemplate.exchange(url, HttpMethod.GET, requestEntity, String.class),
                "GET /products/modified-since"
            );
            JsonNode body = parseBody(response.getBody(), "GET /products/modified-since");
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
            log.error("Viator modified-since request failed (403): {}", body);
            return ViatorFetchResult.failure("403 Forbidden on /products/modified-since");
        } catch (RuntimeException ex) {
            log.error("Viator modified-since request failed: {}", ex.getMessage());
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
            ResponseEntity<String> response = executeWithRetry(
                () -> restTemplate.exchange(url, HttpMethod.GET, requestEntity, String.class),
                "GET /destinations"
            );
            JsonNode body = parseBody(response.getBody(), "GET /destinations");
            if (body == null || !body.isObject()) {
                return List.of();
            }

            List<String> destinationIds = new ArrayList<>();
            JsonNode destinations = body.path("destinations");
            if (destinations.isArray()) {
                for (JsonNode destination : destinations) {
                    String destinationId = firstNonBlank(
                        text(destination, "destinationId"),
                        text(destination, "ref")
                    );
                    if (isNotBlank(destinationId)) {
                        destinationIds.add(destinationId);
                    }
                    if (destinationIds.size() >= maxItems) {
                        break;
                    }
                }
            }
            return destinationIds;
        } catch (RuntimeException ex) {
            log.error("Viator destinations request failed: {}", ex.getMessage());
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

        HttpEntity<String> requestEntity = buildJsonRequestEntity(payload, acceptLanguage);

        try {
            ResponseEntity<String> response = executeWithRetry(
                () -> restTemplate.exchange(url, HttpMethod.POST, requestEntity, String.class),
                "POST /products/search"
            );
            JsonNode body = parseBody(response.getBody(), "POST /products/search");
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
        } catch (RuntimeException ex) {
            log.error("Viator products/search request failed: {}", ex.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Search for products via Viator API when a search term (e.g. city name) is provided.
     * Chains: searchDestinationsByTerm(q) → searchProductsByDestination for each destination.
     *
     * @param searchTerm e.g. "Italy", "Rome"
     * @param page zero-based page index (only page 0 is supported for API search)
     * @param size page size
     * @param currency e.g. "EUR"
     * @param acceptLanguage e.g. "en"
     * @return product search result with products and total count
     */
    public ViatorProductSearchByTermResult searchProductsBySearchTerm(
        String searchTerm,
        int page,
        int size,
        String currency,
        String acceptLanguage
    ) {
        if (!config.isConfigured() || !isNotBlank(searchTerm)) {
            return new ViatorProductSearchByTermResult(List.of(), 0);
        }

        List<ViatorDestinationResult> destinations = searchDestinationsByTerm(
            searchTerm, acceptLanguage, 10
        );
        if (destinations.isEmpty()) {
            return new ViatorProductSearchByTermResult(List.of(), 0);
        }

        String searchLower = searchTerm.trim().toLowerCase();
        List<ViatorDestinationResult> matchingDestinations = destinations.stream()
            .filter(d -> matchesSearchTerm(d, searchLower))
            .toList();
        if (matchingDestinations.isEmpty() && !destinations.isEmpty()) {
            matchingDestinations = destinations;
        }
        if (matchingDestinations.isEmpty()) {
            return new ViatorProductSearchByTermResult(List.of(), 0);
        }

        java.util.Set<String> allowedDestinationRefs = matchingDestinations.stream()
            .map(ViatorDestinationResult::id)
            .filter(id -> isNotBlank(id))
            .collect(java.util.stream.Collectors.toSet());

        int safeSize = Math.min(Math.max(size, 1), 50);
        int perDestination = Math.max((safeSize * 2) / Math.max(matchingDestinations.size(), 1), 10);
        perDestination = Math.min(perDestination, 50);

        List<JsonNode> allProducts = new ArrayList<>();
        java.util.Set<String> seenCodes = new java.util.LinkedHashSet<>();

        boolean singleDestination = matchingDestinations.size() == 1;
        for (ViatorDestinationResult dest : matchingDestinations) {
            if (allProducts.size() >= safeSize * 3) {
                break;
            }
            Optional<ViatorProductSearchPage> pageOpt = searchProductsByDestination(
                dest.id(),
                1,
                perDestination,
                currency,
                acceptLanguage
            );
            if (pageOpt.isEmpty()) {
                continue;
            }
            List<JsonNode> products = pageOpt.get().products() != null
                ? pageOpt.get().products()
                : List.of();
            for (JsonNode product : products) {
                String code = text(product, "productCode");
                if (!isNotBlank(code) || seenCodes.contains(code)) {
                    continue;
                }
                if (!singleDestination) {
                    String primaryRef = extractPrimaryDestinationRef(product);
                    if (primaryRef != null && !allowedDestinationRefs.contains(primaryRef)) {
                        continue;
                    }
                }
                seenCodes.add(code);
                allProducts.add(product);
            }
        }

        int fromIndex = page * safeSize;
        int toIndex = Math.min(fromIndex + safeSize, allProducts.size());
        List<JsonNode> paged = fromIndex < allProducts.size()
            ? allProducts.subList(fromIndex, toIndex)
            : List.of();

        Map<String, String> destinationIdToName = new java.util.LinkedHashMap<>();
        for (ViatorDestinationResult d : matchingDestinations) {
            if (isNotBlank(d.id())) {
                String display = isNotBlank(d.name()) ? d.name() : d.id();
                if (isNotBlank(d.parentDestinationName())) {
                    display = display + ", " + d.parentDestinationName();
                }
                destinationIdToName.putIfAbsent(d.id(), display);
            }
        }
        return new ViatorProductSearchByTermResult(paged, allProducts.size(), destinationIdToName);
    }

    /**
     * Search for products via Viator API for nearby coordinates.
     * Chains: destination refs (from caller) → searchProductsByDestination for each.
     *
     * @param destinationRefs destination IDs from reverse-geocode (e.g. ViatorNearbyDestinationResolver)
     * @param page zero-based page index
     * @param size page size
     * @param currency e.g. "EUR"
     * @param acceptLanguage e.g. "en"
     * @return product search result with products and total count
     */
    public ViatorProductSearchByTermResult searchProductsByCoordinates(
        List<String> destinationRefs,
        int page,
        int size,
        String currency,
        String acceptLanguage
    ) {
        if (!config.isConfigured() || destinationRefs == null || destinationRefs.isEmpty()) {
            return new ViatorProductSearchByTermResult(List.of(), 0);
        }

        int safeSize = Math.min(Math.max(size, 1), 50);
        int perDestination = Math.max((safeSize * 2) / Math.max(destinationRefs.size(), 1), 10);
        perDestination = Math.min(perDestination, 50);

        List<JsonNode> allProducts = new ArrayList<>();
        java.util.Set<String> seenCodes = new java.util.LinkedHashSet<>();

        for (String destRef : destinationRefs) {
            if (allProducts.size() >= safeSize * 3) {
                break;
            }
            Optional<ViatorProductSearchPage> pageOpt = searchProductsByDestination(
                destRef,
                1,
                perDestination,
                currency,
                acceptLanguage
            );
            if (pageOpt.isEmpty()) {
                continue;
            }
            List<JsonNode> products = pageOpt.get().products() != null
                ? pageOpt.get().products()
                : List.of();
            java.util.Set<String> allowedRefs = new java.util.HashSet<>(destinationRefs);
            for (JsonNode product : products) {
                String code = text(product, "productCode");
                if (!isNotBlank(code) || seenCodes.contains(code)) {
                    continue;
                }
                String primaryRef = extractPrimaryDestinationRef(product);
                if (primaryRef != null && !allowedRefs.contains(primaryRef)) {
                    continue;
                }
                seenCodes.add(code);
                allProducts.add(product);
            }
        }

        int fromIndex = page * safeSize;
        int toIndex = Math.min(fromIndex + safeSize, allProducts.size());
        List<JsonNode> paged = fromIndex < allProducts.size()
            ? allProducts.subList(fromIndex, toIndex)
            : List.of();

        return new ViatorProductSearchByTermResult(paged, allProducts.size());
    }

    public List<ViatorDestinationResult> searchDestinationsByTerm(
        String searchTerm,
        String acceptLanguage,
        int count
    ) {
        if (!config.isConfigured() || !isNotBlank(searchTerm)) {
            return List.of();
        }

        UriComponentsBuilder builder = UriComponentsBuilder
            .fromUriString(config.getBaseUrl() + "/search/freetext");
        applyOptionalQueryParams(builder);
        String url = builder.build(true).toUriString();

        int safeCount = Math.min(Math.max(count, 1), 50);
        Map<String, Object> payload = Map.of(
            "searchTerm", searchTerm.trim(),
            "currency", "EUR",
            "searchTypes", List.of(
                Map.of(
                    "searchType", "DESTINATIONS",
                    "pagination", Map.of("start", 1, "count", safeCount)
                )
            )
        );

        HttpEntity<String> requestEntity = buildJsonRequestEntity(payload, acceptLanguage);
        try {
            ResponseEntity<String> response = executeWithRetry(
                () -> restTemplate.exchange(url, HttpMethod.POST, requestEntity, String.class),
                "POST /search/freetext"
            );
            JsonNode body = parseBody(response.getBody(), "POST /search/freetext");
            if (body == null || !body.isObject()) {
                return List.of();
            }

            List<ViatorDestinationResult> destinations = parseDestinationsFromFreetextResponse(body);
            return destinations;
        } catch (RuntimeException ex) {
            log.error("Viator search/freetext destinations request failed: {}", ex.getMessage());
            return List.of();
        }
    }

    public List<JsonNode> getProductsBulk(List<String> productCodes, String acceptLanguage) {
        if (!config.isConfigured() || productCodes == null || productCodes.isEmpty() || bulkEndpointDenied) {
            return List.of();
        }

        UriComponentsBuilder builder = UriComponentsBuilder
            .fromUriString(config.getBaseUrl() + "/products/bulk");
        applyOptionalQueryParams(builder);

        String url = builder.build(true).toUriString();
        HttpEntity<String> requestEntity = buildJsonRequestEntity(
            Map.of("productCodes", productCodes),
            acceptLanguage
        );

        try {
            ResponseEntity<String> response = executeWithRetry(
                () -> restTemplate.exchange(url, HttpMethod.POST, requestEntity, String.class),
                "POST /products/bulk"
            );
            JsonNode body = parseBody(response.getBody(), "POST /products/bulk");
            if (body == null || !body.isArray()) {
                return List.of();
            }
            List<JsonNode> products = new ArrayList<>();
            body.forEach(products::add);
            return products;
        } catch (HttpClientErrorException.Forbidden ex) {
            String body = ex.getResponseBodyAsString();
            String lowered = body != null ? body.toLowerCase() : "";
            if (lowered.contains("endpoint access denied")) {
                bulkEndpointDenied = true;
                log.warn("Endpoint /products/bulk is not enabled for this API key: disabled for this session");
                return List.of();
            }
            log.error("Viator bulk request failed (403): {}", body);
            return List.of();
        } catch (RuntimeException ex) {
            log.error("Viator bulk request failed: {}", ex.getMessage());
            return List.of();
        }
    }

    /**
     * Fetch a single product by product code via GET /products/{productCode}.
     * Fallback when bulk endpoint returns empty or is not available.
     */
    public Optional<JsonNode> getProduct(String productCode, String acceptLanguage) {
        if (!config.isConfigured() || !isNotBlank(productCode)) {
            return Optional.empty();
        }
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(config.getBaseUrl())
            .path("/products/{code}");
        applyOptionalQueryParams(builder);
        String fullUrl = builder.buildAndExpand(productCode).encode().toUriString();
        HttpEntity<Void> requestEntity = new HttpEntity<>(buildHeaders(acceptLanguage, false));

        try {
            ResponseEntity<String> response = executeWithRetry(
                () -> restTemplate.exchange(fullUrl, HttpMethod.GET, requestEntity, String.class),
                "GET /products/" + productCode
            );
            JsonNode body = parseBody(response.getBody(), "GET /products/" + productCode);
            if (body == null || !body.isObject()) {
                return Optional.empty();
            }
            return Optional.of(body);
        } catch (HttpClientErrorException.NotFound ex) {
            return Optional.empty();
        } catch (RuntimeException ex) {
            log.warn("Viator GET /products/{} request failed: {}", productCode, ex.getMessage());
            return Optional.empty();
        }
    }

    private HttpHeaders buildHeaders(String acceptLanguage, boolean withContentType) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("exp-api-key", config.getApiKey());
        headers.set("Accept", config.getAcceptVersion());
        headers.set("Accept-Language", isNotBlank(acceptLanguage) ? acceptLanguage : config.getDefaultLanguage());
        if (withContentType) {
            headers.setContentType(MediaType.APPLICATION_JSON);
        }
        return headers;
    }

    private HttpEntity<String> buildJsonRequestEntity(Map<String, Object> payload, String acceptLanguage) {
        HttpHeaders headers = buildHeaders(acceptLanguage, true);
        try {
            return new HttpEntity<>(objectMapper.writeValueAsString(payload), headers);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Invalid JSON payload", ex);
        }
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
                log.warn("{} rate-limited (attempt {}/{}), retrying in {}ms",
                    operation, attempt, maxAttempts, sleepMs);
                sleep(sleepMs);
            } catch (HttpServerErrorException | ResourceAccessException ex) {
                if (attempt == maxAttempts) {
                    throw ex;
                }
                log.warn("{} temporary error (attempt {}/{}): {}",
                    operation, attempt, maxAttempts, ex.getMessage());
                sleep(fallbackBackoffMs);
            }
        }

        throw new RestClientException(operation + " failed after retries");
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

    /**
     * Keep only destinations that meaningfully match the search term so that e.g. "Italy"
     * returns only destinations in Italy (parent = Italy or name = Italy). For single-word
     * terms we require parent or exact name match only; no substring-in-name matches.
     */
    /**
     * Parse destination list from freetext response. Tries partner-API shape (destinations.results)
     * then legacy shape (data array with searchType DESTINATION and nested data).
     */
    /**
     * Read destination id as string from a freetext result node. API may return "id" as number (e.g. 57);
     * products/search expects "destination" as string (e.g. "57").
     */
    private String destinationIdFromNode(JsonNode item) {
        String id = firstNonBlank(text(item, "id"), text(item, "destinationId"));
        if (isNotBlank(id)) {
            return id;
        }
        JsonNode idNode = item.path("id");
        if (!idNode.isMissingNode() && !idNode.isNull() && idNode.isNumber()) {
            return String.valueOf(idNode.asInt());
        }
        JsonNode destIdNode = item.path("destinationId");
        if (!destIdNode.isMissingNode() && !destIdNode.isNull() && destIdNode.isNumber()) {
            return String.valueOf(destIdNode.asInt());
        }
        return null;
    }

    private List<ViatorDestinationResult> parseDestinationsFromFreetextResponse(JsonNode body) {
        List<ViatorDestinationResult> out = new ArrayList<>();
        JsonNode results = body.path("destinations").path("results");
        if (results.isArray()) {
            for (JsonNode item : results) {
                String id = destinationIdFromNode(item);
                if (!isNotBlank(id)) {
                    continue;
                }
                out.add(new ViatorDestinationResult(
                    id,
                    text(item, "name"),
                    text(item, "parentDestinationName")
                ));
            }
        }
        if (!out.isEmpty()) {
            return out;
        }
        JsonNode data = body.path("data");
        if (data.isArray()) {
            for (JsonNode item : data) {
                String type = text(item, "searchType");
                JsonNode d = item.has("data") ? item.path("data") : item;
                if (!d.isObject()) {
                    continue;
                }
                if ("DESTINATION".equals(type) || d.has("destinationId") || (d.has("name") && (d.has("id") || d.has("destinationId")))) {
                    String id = destinationIdFromNode(d);
                    if (!isNotBlank(id)) {
                        continue;
                    }
                    out.add(new ViatorDestinationResult(
                        id,
                        text(d, "name"),
                        firstNonBlank(text(d, "parentDestinationName"), text(d, "parentName"))
                    ));
                }
            }
        }
        return out;
    }

    private boolean matchesSearchTerm(ViatorDestinationResult dest, String searchLower) {
        if (searchLower == null || searchLower.isBlank()) {
            return false;
        }
        String name = dest.name();
        String parent = dest.parentDestinationName();
        String nameLower = name != null ? name.toLowerCase().trim() : "";
        String parentLower = parent != null ? parent.toLowerCase().trim() : "";

        boolean singleWord = !searchLower.contains(" ");
        if (singleWord) {
            boolean parentEquals = parentLower.equals(searchLower);
            boolean parentContainsWord = containsWholeWord(parentLower, searchLower);
            boolean nameEquals = nameLower.equals(searchLower);
            boolean nameContains = nameLower.contains(searchLower);
            boolean parentContains = parentLower.contains(searchLower);
            return nameEquals || parentEquals || parentContainsWord || nameContains || parentContains;
        }
        return nameLower.contains(searchLower) || parentLower.contains(searchLower);
    }

    private boolean containsWholeWord(String text, String word) {
        if (text == null || word == null || word.isEmpty()) {
            return false;
        }
        int i = text.indexOf(word);
        while (i >= 0) {
            boolean startOk = i == 0 || !Character.isLetter(text.charAt(i - 1));
            boolean endOk = i + word.length() >= text.length() || !Character.isLetter(text.charAt(i + word.length()));
            if (startOk && endOk) {
                return true;
            }
            i = text.indexOf(word, i + 1);
        }
        return false;
    }

    private JsonNode parseBody(String rawBody, String operation) {
        if (!isNotBlank(rawBody)) {
            return null;
        }
        try {
            return objectMapper.readTree(rawBody);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException(
                operation + " risposta JSON non valida: " + ex.getOriginalMessage(),
                ex
            );
        }
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node.path(field);
        if (value.isMissingNode() || value.isNull()) {
            return null;
        }
        String text = value.asText();
        return text != null && !text.isBlank() ? text : null;
    }

    private String extractPrimaryDestinationRef(JsonNode product) {
        JsonNode destinations = product.path("destinations");
        if (!destinations.isArray()) {
            return null;
        }
        for (JsonNode dest : destinations) {
            String ref = text(dest, "ref");
            if (isNotBlank(ref)) {
                return ref;
            }
        }
        return null;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (isNotBlank(value)) {
                return value;
            }
        }
        return null;
    }
}
