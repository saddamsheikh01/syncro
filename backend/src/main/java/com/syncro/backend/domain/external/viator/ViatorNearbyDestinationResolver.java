package com.syncro.backend.domain.external.viator;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncro.backend.domain.external.googlemaps.GoogleMapsConfig;
import com.syncro.backend.domain.external.viator.dto.ViatorDestinationResult;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class ViatorNearbyDestinationResolver {

    private static final Logger log = LoggerFactory.getLogger(ViatorNearbyDestinationResolver.class);
    private static final int DEFAULT_SEARCH_RESULTS = 8;

    private final ViatorClient viatorClient;
    private final GoogleMapsConfig googleMapsConfig;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public ViatorNearbyDestinationResolver(
        ViatorClient viatorClient,
        GoogleMapsConfig googleMapsConfig,
        ObjectMapper objectMapper
    ) {
        this.viatorClient = viatorClient;
        this.googleMapsConfig = googleMapsConfig;
        this.objectMapper = objectMapper;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        int timeoutMs = Math.max(googleMapsConfig.getTimeoutSeconds(), 1) * 1000;
        factory.setConnectTimeout(timeoutMs);
        factory.setReadTimeout(timeoutMs);
        this.restTemplate = new RestTemplate(factory);
    }

    public List<String> resolveDestinationRefs(
        double latitude,
        double longitude,
        String language,
        int maxDestinations
    ) {
        int safeMaxDestinations = Math.max(maxDestinations, 1);
        Optional<GeoContext> geoContext = reverseGeocode(latitude, longitude, language);
        if (geoContext.isEmpty()) {
            return List.of();
        }

        List<String> searchTerms = buildSearchTerms(geoContext.get());
        if (searchTerms.isEmpty()) {
            return List.of();
        }

        Map<String, Integer> scoreByDestination = new LinkedHashMap<>();
        GeoContext geo = geoContext.get();
        for (String term : searchTerms) {
            List<ViatorDestinationResult> results = viatorClient.searchDestinationsByTerm(
                term,
                language,
                DEFAULT_SEARCH_RESULTS
            );
            for (int i = 0; i < results.size(); i++) {
                ViatorDestinationResult result = results.get(i);
                if (!matchesGeoContext(result, geo)) {
                    continue;
                }
                String destinationId = normalize(result.id());
                if (destinationId == null) {
                    continue;
                }
                int score = scoreDestination(result, geo, term, i);
                scoreByDestination.merge(destinationId, score, Math::max);
            }
        }

        return scoreByDestination.entrySet()
            .stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue(Comparator.reverseOrder()))
            .limit(safeMaxDestinations)
            .map(Map.Entry::getKey)
            .toList();
    }

    private Optional<GeoContext> reverseGeocode(double latitude, double longitude, String language) {
        if (!googleMapsConfig.isConfigured()) {
            return Optional.empty();
        }

        UriComponentsBuilder builder = UriComponentsBuilder
            .fromUriString(googleMapsConfig.getBaseUrl() + "/geocode/json")
            .queryParam("latlng", latitude + "," + longitude)
            .queryParam("key", googleMapsConfig.getApiKey());
        if (normalize(language) != null) {
            builder.queryParam("language", normalize(language));
        }
        String url = builder.build().toUriString();

        try {
            String rawBody = restTemplate.getForObject(url, String.class);
            if (rawBody == null || rawBody.isBlank()) {
                return Optional.empty();
            }
            JsonNode body = objectMapper.readTree(rawBody);
            String status = normalize(body.path("status").asText(null));
            if (!"OK".equalsIgnoreCase(status)) {
                log.warn("Google reverse geocoding status={} per lat={}, lng={}", status, latitude, longitude);
                return Optional.empty();
            }

            JsonNode results = body.path("results");
            if (!results.isArray() || results.isEmpty()) {
                return Optional.empty();
            }

            String city = null;
            String region = null;
            String country = null;
            String countryCode = null;

            for (JsonNode result : results) {
                JsonNode components = result.path("address_components");
                if (!components.isArray()) {
                    continue;
                }
                if (city == null) {
                    city = extractAddressComponent(components, "locality", true);
                }
                if (region == null) {
                    region = extractAddressComponent(components, "administrative_area_level_1", true);
                }
                if (country == null) {
                    country = extractAddressComponent(components, "country", true);
                }
                if (countryCode == null) {
                    countryCode = extractAddressComponent(components, "country", false);
                }
                if (city != null && country != null) {
                    break;
                }
            }

            if (city == null && region == null && country == null) {
                return Optional.empty();
            }
            return Optional.of(new GeoContext(city, region, country, countryCode));
        } catch (RestClientException ex) {
            log.warn("Google reverse geocoding failed: {}", ex.getMessage());
            return Optional.empty();
        } catch (Exception ex) {
            log.warn("Failed to parse Google reverse geocoding response: {}", ex.getMessage());
            return Optional.empty();
        }
    }

    private String extractAddressComponent(JsonNode components, String type, boolean longName) {
        for (JsonNode component : components) {
            JsonNode types = component.path("types");
            if (!types.isArray()) {
                continue;
            }
            for (JsonNode item : types) {
                if (type.equals(item.asText())) {
                    String value = longName
                        ? component.path("long_name").asText(null)
                        : component.path("short_name").asText(null);
                    return normalize(value);
                }
            }
        }
        return null;
    }

    private List<String> buildSearchTerms(GeoContext geoContext) {
        Set<String> terms = new LinkedHashSet<>();
        if (geoContext.city != null && geoContext.country != null) {
            terms.add(geoContext.city + ", " + geoContext.country);
        }
        if (geoContext.city != null) {
            terms.add(geoContext.city);
        }
        if (geoContext.region != null && geoContext.country != null) {
            terms.add(geoContext.region + ", " + geoContext.country);
        }
        if (geoContext.region != null) {
            terms.add(geoContext.region);
        }
        if (geoContext.country != null) {
            terms.add(geoContext.country);
        }
        if (geoContext.countryCode != null) {
            terms.add(geoContext.countryCode);
        }
        return new ArrayList<>(terms);
    }

    /**
     * Filter out destinations that don't match the user's geo (e.g. Korea when in Pakistan).
     * When country/countryCode are unknown, require city/region match to avoid geographic pollution.
     */
    private boolean matchesGeoContext(ViatorDestinationResult result, GeoContext geo) {
        String normalizedCountry = normalizeForMatch(geo.country());
        String normalizedCountryCode = normalizeForMatch(geo.countryCode());
        String normalizedParent = normalizeForMatch(result.parentDestinationName());
        String normalizedName = normalizeForMatch(result.name());
        String normalizedCity = normalizeForMatch(geo.city());
        String normalizedRegion = normalizeForMatch(geo.region());

        if (normalizedCountry != null || normalizedCountryCode != null) {
            boolean parentMatches = normalizedParent != null
                && (normalizedCountry != null && normalizedParent.contains(normalizedCountry)
                    || normalizedCountryCode != null && normalizedParent.contains(normalizedCountryCode));
            boolean nameMatches = normalizedName != null
                && (normalizedCountry != null && normalizedName.contains(normalizedCountry)
                    || normalizedCountryCode != null && normalizedName.contains(normalizedCountryCode));
            if (parentMatches || nameMatches) {
                return true;
            }
        }

        if (normalizedCity == null && normalizedRegion == null) {
            return false;
        }
        boolean cityRegionMatch = (normalizedCity != null && normalizedName != null && normalizedName.contains(normalizedCity))
            || (normalizedRegion != null && normalizedName != null && normalizedName.contains(normalizedRegion))
            || (normalizedCity != null && normalizedParent != null && normalizedParent.contains(normalizedCity))
            || (normalizedRegion != null && normalizedParent != null && normalizedParent.contains(normalizedRegion));
        return cityRegionMatch;
    }

    private int scoreDestination(ViatorDestinationResult result, GeoContext geoContext, String term, int index) {
        int score = Math.max(0, 100 - index);
        String normalizedName = normalizeForMatch(result.name());
        String normalizedParent = normalizeForMatch(result.parentDestinationName());
        String normalizedTerm = normalizeForMatch(term);
        String normalizedCity = normalizeForMatch(geoContext.city);
        String normalizedRegion = normalizeForMatch(geoContext.region);
        String normalizedCountry = normalizeForMatch(geoContext.country);
        String normalizedCountryCode = normalizeForMatch(geoContext.countryCode);

        if (normalizedTerm != null && normalizedTerm.equals(normalizedName)) {
            score += 300;
        }
        if (normalizedCity != null) {
            if (normalizedCity.equals(normalizedName)) {
                score += 250;
            } else if (normalizedName != null && normalizedName.contains(normalizedCity)) {
                score += 160;
            }
        }
        if (normalizedRegion != null) {
            if (normalizedRegion.equals(normalizedName)) {
                score += 120;
            } else if (normalizedName != null && normalizedName.contains(normalizedRegion)) {
                score += 70;
            }
        }
        if (normalizedCountry != null) {
            if (normalizedCountry.equals(normalizedName) || normalizedCountry.equals(normalizedParent)) {
                score += 120;
            } else if (
                (normalizedParent != null && normalizedParent.contains(normalizedCountry))
                    || (normalizedName != null && normalizedName.contains(normalizedCountry))
            ) {
                score += 80;
            }
        }
        if (normalizedCountryCode != null) {
            if (
                (normalizedParent != null && normalizedParent.contains(normalizedCountryCode))
                    || (normalizedName != null && normalizedName.contains(normalizedCountryCode))
            ) {
                score += 40;
            }
        }
        return score;
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeForMatch(String value) {
        String normalized = normalize(value);
        if (normalized == null) {
            return null;
        }
        String withoutAccents = Normalizer
            .normalize(normalized, Normalizer.Form.NFD)
            .replaceAll("\\p{M}+", "");
        return withoutAccents.toLowerCase(Locale.ROOT);
    }

    private record GeoContext(
        String city,
        String region,
        String country,
        String countryCode
    ) {}
}
