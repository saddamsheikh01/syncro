package com.syncro.backend.domain.external.googlemaps;

import com.syncro.backend.domain.catalog.entity.CatalogSource;
import com.syncro.backend.domain.catalog.entity.Place;
import com.syncro.backend.domain.external.googlemaps.dto.GooglePlaceResponse;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class GoogleMapsPlaceMapper {

    private final GoogleMapsClient googleMapsClient;

    public GoogleMapsPlaceMapper(GoogleMapsClient googleMapsClient) {
        this.googleMapsClient = googleMapsClient;
    }

    /**
     * Converte una risposta Google Place in una nuova entity Place.
     */
    public Place toPlace(GooglePlaceResponse google) {
        Place place = new Place();
        updatePlace(place, google);
        place.setSource(CatalogSource.GOOGLE);
        return place;
    }

    /**
     * Aggiorna una entity Place esistente con i dati di Google.
     */
    public void updatePlace(Place place, GooglePlaceResponse google) {
        place.setGooglePlaceId(google.getPlaceId());
        place.setName(google.getName());
        place.setAddress(google.getFormattedAddress());

        // Coordinate
        if (google.getGeometry() != null && google.getGeometry().getLocation() != null) {
            place.setLatitude(google.getGeometry().getLocation().getLat());
            place.setLongitude(google.getGeometry().getLocation().getLng());
        }

        // Contatti
        place.setPhone(google.getInternationalPhoneNumber() != null
            ? google.getInternationalPhoneNumber()
            : google.getFormattedPhoneNumber());
        place.setWebsite(google.getWebsite());

        // Rating e recensioni
        if (google.getRating() != null) {
            place.setGoogleRating(BigDecimal.valueOf(google.getRating()));
        }
        place.setGoogleReviewCount(google.getUserRatingsTotal());
        place.setPriceLevel(google.getPriceLevel());

        // Tipi Google
        if (google.getTypes() != null) {
            place.setGoogleTypes(new ArrayList<>(google.getTypes()));
        }

        // Estrai città e paese dai componenti indirizzo
        extractAddressComponents(place, google);

        // Orari di apertura
        if (google.getOpeningHours() != null) {
            place.setOpeningHours(mapOpeningHours(google.getOpeningHours()));
        }

        // Foto
        if (google.getPhotos() != null && !google.getPhotos().isEmpty()) {
            List<String> photoUrls = new ArrayList<>();
            for (int i = 0; i < Math.min(google.getPhotos().size(), 10); i++) {
                String photoRef = google.getPhotos().get(i).getPhotoReference();
                if (photoRef != null) {
                    photoUrls.add(googleMapsClient.getPhotoUrl(photoRef, 800));
                }
            }
            place.setPhotos(photoUrls);
            if (!photoUrls.isEmpty()) {
                place.setImageUrl(photoUrls.get(0));
            }
        }

        // Timestamp sync
        place.setLastSyncedAt(Instant.now());
        place.setIsActive(true);
    }

    private void extractAddressComponents(Place place, GooglePlaceResponse google) {
        if (google.getAddressComponents() == null) {
            return;
        }

        for (GooglePlaceResponse.AddressComponent component : google.getAddressComponents()) {
            if (component.getTypes() == null) {
                continue;
            }

            if (component.getTypes().contains("locality")) {
                place.setCity(component.getLongName());
            } else if (component.getTypes().contains("administrative_area_level_3") && place.getCity() == null) {
                // Fallback per città
                place.setCity(component.getLongName());
            } else if (component.getTypes().contains("country")) {
                place.setCountry(component.getLongName());
            } else if (component.getTypes().contains("postal_code")) {
                place.setPostalCode(component.getLongName());
            }
        }
    }

    private Map<String, Object> mapOpeningHours(GooglePlaceResponse.OpeningHours hours) {
        Map<String, Object> result = new HashMap<>();

        if (hours.getOpenNow() != null) {
            result.put("openNow", hours.getOpenNow());
        }

        if (hours.getWeekdayText() != null) {
            result.put("weekdayText", hours.getWeekdayText());
        }

        if (hours.getPeriods() != null) {
            List<Map<String, Object>> periods = new ArrayList<>();
            for (GooglePlaceResponse.Period period : hours.getPeriods()) {
                Map<String, Object> p = new HashMap<>();
                if (period.getOpen() != null) {
                    p.put("openDay", period.getOpen().getDay());
                    p.put("openTime", period.getOpen().getTime());
                }
                if (period.getClose() != null) {
                    p.put("closeDay", period.getClose().getDay());
                    p.put("closeTime", period.getClose().getTime());
                }
                periods.add(p);
            }
            result.put("periods", periods);
        }

        return result;
    }
}
