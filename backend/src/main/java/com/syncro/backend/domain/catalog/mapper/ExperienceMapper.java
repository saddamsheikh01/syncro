package com.syncro.backend.domain.catalog.mapper;

import com.syncro.backend.domain.catalog.dto.AffiliationLinkResponse;
import com.syncro.backend.domain.catalog.dto.CategoryResponse;
import com.syncro.backend.domain.catalog.dto.ExperienceDetailResponse;
import com.syncro.backend.domain.catalog.dto.ExperienceSummaryResponse;
import com.syncro.backend.domain.catalog.dto.PlaceReferenceResponse;
import com.syncro.backend.domain.catalog.entity.Experience;
import com.syncro.backend.domain.tags.dto.TagResponse;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class ExperienceMapper {

    public ExperienceSummaryResponse toSummaryResponse(
        Experience experience,
        CategoryResponse category,
        PlaceReferenceResponse place
    ) {
        return new ExperienceSummaryResponse(
            experience.getId(),
            experience.getExternalId(),
            experience.getName(),
            experience.getDescription(),
            category,
            place,
            experience.getSource(),
            experience.getProvider(),
            experience.getImageUrl(),
            experience.getPrice(),
            experience.getPriceCurrency(),
            experience.getOriginalPrice(),
            experience.getDurationMinutes(),
            experience.getRating(),
            experience.getReviewCount(),
            experience.getLocationName(),
            experience.getIsActive()
        );
    }

    public ExperienceDetailResponse toDetailResponse(
        Experience experience,
        CategoryResponse category,
        PlaceReferenceResponse place,
        List<TagResponse> tags,
        List<AffiliationLinkResponse> affiliationLinks
    ) {
        return new ExperienceDetailResponse(
            experience.getId(),
            experience.getName(),
            experience.getDescription(),
            category,
            place,
            experience.getSource(),
            tags,
            affiliationLinks,
            experience.getCreatedAt(),
            experience.getUpdatedAt(),
            experience.getProvider(),
            experience.getExternalId(),
            experience.getPrice(),
            experience.getPriceCurrency(),
            experience.getOriginalPrice(),
            experience.getDurationMinutes(),
            experience.getImageUrl(),
            experience.getImages(),
            experience.getBookingUrl(),
            experience.getRating(),
            experience.getReviewCount(),
            experience.getLatitude(),
            experience.getLongitude(),
            experience.getLocationName(),
            experience.getHighlights(),
            experience.getInclusions(),
            experience.getExclusions(),
            experience.getLanguages(),
            experience.getCancellationPolicy(),
            experience.getMeetingPoint(),
            experience.getMinParticipants(),
            experience.getMaxParticipants(),
            experience.getLastSyncedAt(),
            experience.getIsActive()
        );
    }
}
