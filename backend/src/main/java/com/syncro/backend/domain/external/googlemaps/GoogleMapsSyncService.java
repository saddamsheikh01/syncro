package com.syncro.backend.domain.external.googlemaps;

import com.syncro.backend.domain.catalog.entity.Place;
import com.syncro.backend.domain.catalog.repository.PlaceRepository;
import com.syncro.backend.domain.external.googlemaps.dto.GooglePlaceDetailsResponse;
import com.syncro.backend.domain.external.googlemaps.dto.GooglePlaceResponse;
import com.syncro.backend.domain.external.googlemaps.dto.GoogleSearchResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class GoogleMapsSyncService {

    private static final Logger log = LoggerFactory.getLogger(GoogleMapsSyncService.class);

    private final GoogleMapsClient googleMapsClient;
    private final GoogleMapsPlaceMapper placeMapper;
    private final PlaceRepository placeRepository;
    private final GoogleMapsConfig config;

    public GoogleMapsSyncService(
        GoogleMapsClient googleMapsClient,
        GoogleMapsPlaceMapper placeMapper,
        PlaceRepository placeRepository,
        GoogleMapsConfig config
    ) {
        this.googleMapsClient = googleMapsClient;
        this.placeMapper = placeMapper;
        this.placeRepository = placeRepository;
        this.config = config;
    }

    /**
     * Risultato di una operazione di sync.
     */
    public record SyncResult(
        int totalFound,
        int created,
        int updated,
        int errors,
        List<String> errorMessages
    ) {
        public static SyncResult empty() {
            return new SyncResult(0, 0, 0, 0, new ArrayList<>());
        }
    }

    /**
     * Sincronizza i luoghi vicini a una posizione.
     *
     * @param latitude latitudine del centro
     * @param longitude longitudine del centro
     * @param radiusMeters raggio in metri
     * @param type tipo di luogo Google (es. restaurant, cafe)
     * @param maxResults numero massimo di risultati da sincronizzare
     * @return risultato della sincronizzazione
     */
    @Transactional
    public SyncResult syncNearbyPlaces(
        double latitude,
        double longitude,
        int radiusMeters,
        String type,
        int maxResults
    ) {
        if (!config.isConfigured()) {
            log.error("Google Maps API key is not configured");
            return new SyncResult(0, 0, 0, 1, List.of("API key is not configured"));
        }

        log.info("Starting place sync: lat={}, lng={}, radius={}m, type={}, maxResults={}",
            latitude, longitude, radiusMeters, type, maxResults);

        int totalFound = 0;
        int created = 0;
        int updated = 0;
        int errors = 0;
        List<String> errorMessages = new ArrayList<>();

        Optional<GoogleSearchResponse> searchResult = googleMapsClient.nearbySearch(
            latitude, longitude, radiusMeters, type
        );

        while (searchResult.isPresent() && totalFound < maxResults) {
            GoogleSearchResponse response = searchResult.get();

            if (response.getResults() == null || response.getResults().isEmpty()) {
                break;
            }

            for (GooglePlaceResponse googlePlace : response.getResults()) {
                if (totalFound >= maxResults) {
                    break;
                }

                totalFound++;

                try {
                    SyncPlaceResult result = syncSinglePlace(googlePlace);
                    if (result.isCreated()) {
                        created++;
                    } else if (result.isUpdated()) {
                        updated++;
                    }
                } catch (Exception e) {
                    errors++;
                    String msg = "Error syncing place " + googlePlace.getName() + ": " + e.getMessage();
                    errorMessages.add(msg);
                    log.error(msg, e);
                }
            }

            // Prossima pagina se disponibile
            if (response.getNextPageToken() != null && totalFound < maxResults) {
                searchResult = googleMapsClient.getNextPage(response.getNextPageToken());
            } else {
                break;
            }
        }

        log.info("Sync completed: found={}, created={}, updated={}, errors={}",
            totalFound, created, updated, errors);

        return new SyncResult(totalFound, created, updated, errors, errorMessages);
    }

    /**
     * Sincronizza luoghi da una ricerca testuale.
     *
     * @param query testo di ricerca
     * @param latitude latitudine opzionale per bias
     * @param longitude longitudine opzionale per bias
     * @param radiusMeters raggio opzionale per bias
     * @param maxResults numero massimo di risultati
     * @return risultato della sincronizzazione
     */
    @Transactional
    public SyncResult syncByTextSearch(
        String query,
        Double latitude,
        Double longitude,
        Integer radiusMeters,
        int maxResults
    ) {
        if (!config.isConfigured()) {
            log.error("Google Maps API key is not configured");
            return new SyncResult(0, 0, 0, 1, List.of("API key is not configured"));
        }

        log.info("Starting search sync: query={}, maxResults={}", query, maxResults);

        int totalFound = 0;
        int created = 0;
        int updated = 0;
        int errors = 0;
        List<String> errorMessages = new ArrayList<>();

        Optional<GoogleSearchResponse> searchResult = googleMapsClient.textSearch(
            query, latitude, longitude, radiusMeters
        );

        if (searchResult.isPresent()) {
            GoogleSearchResponse response = searchResult.get();

            if (response.getResults() != null) {
                for (GooglePlaceResponse googlePlace : response.getResults()) {
                    if (totalFound >= maxResults) {
                        break;
                    }

                    totalFound++;

                    try {
                        SyncPlaceResult result = syncSinglePlace(googlePlace);
                        if (result.isCreated()) {
                            created++;
                        } else if (result.isUpdated()) {
                            updated++;
                        }
                    } catch (Exception e) {
                        errors++;
                        String msg = "Error syncing place " + googlePlace.getName() + ": " + e.getMessage();
                        errorMessages.add(msg);
                        log.error(msg, e);
                    }
                }
            }
        }

        log.info("Sync completed: found={}, created={}, updated={}, errors={}",
            totalFound, created, updated, errors);

        return new SyncResult(totalFound, created, updated, errors, errorMessages);
    }

    /**
     * Sincronizza un singolo luogo dal suo Google Place ID.
     *
     * @param googlePlaceId ID del luogo Google
     * @return risultato della sincronizzazione
     */
    @Transactional
    public SyncResult syncSinglePlaceById(String googlePlaceId) {
        if (!config.isConfigured()) {
            return new SyncResult(0, 0, 0, 1, List.of("API key is not configured"));
        }

        Optional<GooglePlaceDetailsResponse> detailsOpt = googleMapsClient.getPlaceDetails(googlePlaceId);

        if (detailsOpt.isEmpty()) {
            return new SyncResult(1, 0, 0, 1, List.of("Place not found: " + googlePlaceId));
        }

        try {
            SyncPlaceResult result = syncSinglePlace(detailsOpt.get().getResult());
            return new SyncResult(
                1,
                result.isCreated() ? 1 : 0,
                result.isUpdated() ? 1 : 0,
                0,
                new ArrayList<>()
            );
        } catch (Exception e) {
            return new SyncResult(1, 0, 0, 1, List.of(e.getMessage()));
        }
    }

    /**
     * Aggiorna un luogo esistente con i dati più recenti da Google.
     *
     * @param place luogo da aggiornare
     * @return luogo aggiornato
     */
    @Transactional
    public Optional<Place> refreshPlace(Place place) {
        if (place.getGooglePlaceId() == null) {
            log.warn("Place {} does not have a Google Place ID", place.getId());
            return Optional.empty();
        }

        Optional<GooglePlaceDetailsResponse> detailsOpt =
            googleMapsClient.getPlaceDetails(place.getGooglePlaceId());

        if (detailsOpt.isEmpty()) {
            log.warn("Unable to fetch details for Google Place ID: {}", place.getGooglePlaceId());
            return Optional.empty();
        }

        placeMapper.updatePlace(place, detailsOpt.get().getResult());
        Place saved = placeRepository.save(place);
        log.info("Place updated: {} ({})", saved.getName(), saved.getId());

        return Optional.of(saved);
    }

    private record SyncPlaceResult(boolean isCreated, boolean isUpdated, Place place) {}

    private SyncPlaceResult syncSinglePlace(GooglePlaceResponse googlePlace) {
        String googlePlaceId = googlePlace.getPlaceId();

        // Cerca se esiste già
        Optional<Place> existingOpt = placeRepository.findByGooglePlaceId(googlePlaceId);

        if (existingOpt.isPresent()) {
            // Aggiorna esistente
            Place existing = existingOpt.get();
            placeMapper.updatePlace(existing, googlePlace);
            Place saved = placeRepository.save(existing);
            log.debug("Place updated: {} ({})", saved.getName(), saved.getId());
            return new SyncPlaceResult(false, true, saved);
        } else {
            // Ottieni dettagli completi prima di creare
            Optional<GooglePlaceDetailsResponse> detailsOpt =
                googleMapsClient.getPlaceDetails(googlePlaceId);

            Place newPlace;
            if (detailsOpt.isPresent()) {
                newPlace = placeMapper.toPlace(detailsOpt.get().getResult());
            } else {
                // Usa i dati base se i dettagli non sono disponibili
                newPlace = placeMapper.toPlace(googlePlace);
            }

            Place saved = placeRepository.save(newPlace);
            log.debug("Place created: {} ({})", saved.getName(), saved.getId());
            return new SyncPlaceResult(true, false, saved);
        }
    }
}
