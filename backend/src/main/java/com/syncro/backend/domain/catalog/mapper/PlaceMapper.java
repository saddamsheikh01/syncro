package com.syncro.backend.domain.catalog.mapper;

import com.syncro.backend.domain.catalog.dto.AffiliationLinkResponse;
import com.syncro.backend.domain.catalog.dto.CategoryResponse;
import com.syncro.backend.domain.catalog.dto.PlaceDetailResponse;
import com.syncro.backend.domain.catalog.dto.PlaceReferenceResponse;
import com.syncro.backend.domain.catalog.dto.PlaceSummaryResponse;
import com.syncro.backend.domain.catalog.entity.Place;
import com.syncro.backend.domain.tags.dto.TagResponse;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class PlaceMapper {

    public PlaceSummaryResponse toSummaryResponse(Place place, CategoryResponse category) {
        return new PlaceSummaryResponse(
            place.getId(),
            place.getName(),
            place.getDescription(),
            place.getLatitude(),
            place.getLongitude(),
            category,
            place.getSource(),
            // Google Maps
            place.getGooglePlaceId(),
            place.getAddress(),
            place.getCity(),
            place.getCountry(),
            place.getImageUrl(),
            place.getGoogleRating(),
            place.getGoogleReviewCount(),
            place.getPriceLevel(),
            place.getIsActive()
        );
    }

    public PlaceDetailResponse toDetailResponse(
        Place place,
        CategoryResponse category,
        List<TagResponse> tags,
        List<AffiliationLinkResponse> affiliationLinks
    ) {
        return new PlaceDetailResponse(
            place.getId(),
            place.getName(),
            place.getDescription(),
            place.getLatitude(),
            place.getLongitude(),
            category,
            place.getSource(),
            tags,
            affiliationLinks,
            // Google Maps
            place.getGooglePlaceId(),
            place.getAddress(),
            place.getCity(),
            place.getCountry(),
            place.getPostalCode(),
            place.getPhone(),
            place.getWebsite(),
            place.getGoogleRating(),
            place.getGoogleReviewCount(),
            place.getPriceLevel(),
            place.getImageUrl(),
            place.getPhotos(),
            place.getOpeningHours(),
            place.getGoogleTypes(),
            place.getIsActive(),
            place.getLastSyncedAt(),
            place.getCreatedAt(),
            place.getUpdatedAt()
        );
    }

    public PlaceReferenceResponse toReferenceResponse(Place place) {
        return new PlaceReferenceResponse(
            place.getId(),
            place.getName(),
            place.getLatitude(),
            place.getLongitude()
        );
    }
}
