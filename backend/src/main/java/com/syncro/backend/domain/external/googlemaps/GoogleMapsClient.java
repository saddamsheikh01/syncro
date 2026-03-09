package com.syncro.backend.domain.external.googlemaps;

import com.syncro.backend.domain.external.googlemaps.dto.GooglePlaceDetailsResponse;
import com.syncro.backend.domain.external.googlemaps.dto.GoogleSearchResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import java.util.Optional;

@Component
public class GoogleMapsClient {

    private static final Logger log = LoggerFactory.getLogger(GoogleMapsClient.class);

    private final GoogleMapsConfig config;
    private final RestTemplate restTemplate;

    public GoogleMapsClient(GoogleMapsConfig config) {
        this.config = config;
        this.restTemplate = new RestTemplate();
    }

    /**
     * Cerca luoghi nelle vicinanze di una posizione.
     *
     * @param latitude latitudine del centro di ricerca
     * @param longitude longitudine del centro di ricerca
     * @param radiusMeters raggio di ricerca in metri (max 50000)
     * @param type tipo di luogo Google (es. restaurant, cafe, museum)
     * @return risposta con i risultati della ricerca
     */
    public Optional<GoogleSearchResponse> nearbySearch(
        double latitude,
        double longitude,
        int radiusMeters,
        String type
    ) {
        if (!config.isConfigured()) {
            log.warn("Google Maps API key is not configured");
            return Optional.empty();
        }

        String url = UriComponentsBuilder
            .fromUriString(config.getBaseUrl() + "/place/nearbysearch/json")
            .queryParam("location", latitude + "," + longitude)
            .queryParam("radius", Math.min(radiusMeters, 50000))
            .queryParam("type", type)
            .queryParam("key", config.getApiKey())
            .build()
            .toUriString();

        return executeSearch(url);
    }

    /**
     * Cerca luoghi per testo.
     *
     * @param query testo di ricerca
     * @param latitude latitudine opzionale per bias geografico
     * @param longitude longitudine opzionale per bias geografico
     * @param radiusMeters raggio opzionale per bias geografico
     * @return risposta con i risultati della ricerca
     */
    public Optional<GoogleSearchResponse> textSearch(
        String query,
        Double latitude,
        Double longitude,
        Integer radiusMeters
    ) {
        if (!config.isConfigured()) {
            log.warn("Google Maps API key is not configured");
            return Optional.empty();
        }

        UriComponentsBuilder builder = UriComponentsBuilder
            .fromUriString(config.getBaseUrl() + "/place/textsearch/json")
            .queryParam("query", query)
            .queryParam("key", config.getApiKey());

        if (latitude != null && longitude != null) {
            builder.queryParam("location", latitude + "," + longitude);
            if (radiusMeters != null) {
                builder.queryParam("radius", Math.min(radiusMeters, 50000));
            }
        }

        return executeSearch(builder.build().toUriString());
    }

    /**
     * Ottiene i dettagli completi di un luogo.
     *
     * @param placeId ID del luogo Google
     * @return risposta con i dettagli del luogo
     */
    public Optional<GooglePlaceDetailsResponse> getPlaceDetails(String placeId) {
        if (!config.isConfigured()) {
            log.warn("Google Maps API key is not configured");
            return Optional.empty();
        }

        String url = UriComponentsBuilder
            .fromUriString(config.getBaseUrl() + "/place/details/json")
            .queryParam("place_id", placeId)
            .queryParam("fields", String.join(",",
                "place_id",
                "name",
                "formatted_address",
                "formatted_phone_number",
                "international_phone_number",
                "website",
                "rating",
                "user_ratings_total",
                "price_level",
                "geometry",
                "types",
                "photos",
                "opening_hours",
                "address_components"
            ))
            .queryParam("key", config.getApiKey())
            .build()
            .toUriString();

        try {
            log.debug("Google Place Details request: placeId={}", placeId);
            GooglePlaceDetailsResponse response = restTemplate.getForObject(
                url,
                GooglePlaceDetailsResponse.class
            );

            if (response != null && response.isSuccess()) {
                log.debug("Place details received: {}", response.getResult().getName());
                return Optional.of(response);
            } else {
                String error = response != null ? response.getErrorMessage() : "Null response";
                log.warn("Google Place Details error: {}", error);
                return Optional.empty();
            }
        } catch (RestClientException e) {
            log.error("Google Place Details request failed: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Ottiene la prossima pagina di risultati di ricerca.
     *
     * @param nextPageToken token per la paginazione
     * @return risposta con i risultati della ricerca
     */
    public Optional<GoogleSearchResponse> getNextPage(String nextPageToken) {
        if (!config.isConfigured()) {
            log.warn("Google Maps API key is not configured");
            return Optional.empty();
        }

        String url = UriComponentsBuilder
            .fromUriString(config.getBaseUrl() + "/place/nearbysearch/json")
            .queryParam("pagetoken", nextPageToken)
            .queryParam("key", config.getApiKey())
            .build()
            .toUriString();

        // Google richiede un breve delay prima di usare il pagetoken
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        return executeSearch(url);
    }

    /**
     * Genera l'URL per una foto di un luogo.
     *
     * @param photoReference riferimento della foto
     * @param maxWidth larghezza massima
     * @return URL della foto
     */
    public String getPhotoUrl(String photoReference, int maxWidth) {
        return UriComponentsBuilder
            .fromUriString(config.getBaseUrl() + "/place/photo")
            .queryParam("photoreference", photoReference)
            .queryParam("maxwidth", maxWidth)
            .queryParam("key", config.getApiKey())
            .build()
            .toUriString();
    }

    private Optional<GoogleSearchResponse> executeSearch(String url) {
        try {
            log.debug("Google Search request: {}", url.replaceAll("key=[^&]+", "key=***"));
            GoogleSearchResponse response = restTemplate.getForObject(url, GoogleSearchResponse.class);

            if (response != null && response.isSuccess()) {
                int count = response.getResults() != null ? response.getResults().size() : 0;
                log.debug("Search completed: {} results", count);
                return Optional.of(response);
            } else {
                String error = response != null ? response.getErrorMessage() : "Null response";
                String status = response != null ? response.getStatus() : "UNKNOWN";
                log.warn("Google Search error: status={}, error={}", status, error);
                return Optional.empty();
            }
        } catch (RestClientException e) {
            log.error("Google Search request failed: {}", e.getMessage());
            return Optional.empty();
        }
    }
}
