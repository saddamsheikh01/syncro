package com.syncro.backend.domain.external.viator;

import com.fasterxml.jackson.databind.JsonNode;
import com.syncro.backend.domain.catalog.dto.ExperienceDetailResponse;
import com.syncro.backend.domain.catalog.dto.ExperienceSummaryResponse;
import com.syncro.backend.domain.catalog.entity.CatalogSource;
import com.syncro.backend.domain.catalog.entity.Experience;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class ViatorProductMapper {

    public void updateExperience(Experience experience, JsonNode product, Instant syncedAt) {
        experience.setSource(CatalogSource.VIATOR);
        experience.setProvider("VIATOR");
        experience.setExternalId(text(product, "productCode"));
        experience.setName(firstNonBlank(
            text(product, "title"),
            text(product, "productCode")
        ));
        experience.setDescription(text(product, "description"));
        experience.setBookingUrl(text(product, "productUrl"));
        experience.setIsActive(true);
        experience.setLastSyncedAt(syncedAt);

        BigDecimal rating = decimal(product.path("reviews").path("combinedAverageRating"));
        if (rating != null) {
            experience.setRating(rating.setScale(1, RoundingMode.HALF_UP));
        } else {
            experience.setRating(null);
        }
        experience.setReviewCount(intValue(product.path("reviews").path("totalReviews")));

        experience.setLanguages(readLanguages(product.path("languageGuides")));
        experience.setInclusions(readInclusionExclusion(product.path("inclusions")));
        experience.setExclusions(readInclusionExclusion(product.path("exclusions")));
        experience.setHighlights(readHighlights(product));

        experience.setCancellationPolicy(text(product.path("cancellationPolicy"), "description"));
        experience.setMeetingPoint(readMeetingPoint(product.path("logistics")));
        experience.setLocationName(readLocationName(product.path("destinations")));
        experience.setDurationMinutes(readDurationMinutes(product.path("itinerary")));
        experience.setMinParticipants(readMinParticipants(product.path("pricingInfo")));
        experience.setMaxParticipants(readMaxParticipants(product.path("pricingInfo")));

        List<String> imageUrls = readImageUrls(product.path("images"));
        experience.setImages(imageUrls);
        experience.setImageUrl(imageUrls.isEmpty() ? null : imageUrls.getFirst());
    }

    /**
     * Map Viator product JSON to ExperienceSummaryResponse for live API search results.
     * Uses a deterministic synthetic UUID from productCode (no DB record).
     */
    public ExperienceSummaryResponse toSummaryResponse(JsonNode product) {
        return toSummaryResponse(product, null);
    }

    /**
     * Map Viator product JSON to ExperienceSummaryResponse with optional destination id→name map.
     * When destinationIdToName is provided (e.g. from freetext search), locationName is the display name; otherwise the destination ref (id) is used.
     */
    public ExperienceSummaryResponse toSummaryResponse(JsonNode product, Map<String, String> destinationIdToName) {
        String productCode = text(product, "productCode");
        UUID syntheticId = productCode != null
            ? UUID.nameUUIDFromBytes(("viator-live-" + productCode).getBytes(StandardCharsets.UTF_8))
            : UUID.randomUUID();

        String name = firstNonBlank(text(product, "title"), productCode);
        String description = text(product, "description");

        BigDecimal rating = decimal(product.path("reviews").path("combinedAverageRating"));
        if (rating != null) {
            rating = rating.setScale(1, RoundingMode.HALF_UP);
        }
        Integer reviewCount = intValue(product.path("reviews").path("totalReviews"));

        List<String> imageUrls = readImageUrls(product.path("images"));
        String imageUrl = imageUrls.isEmpty() ? null : imageUrls.getFirst();

        JsonNode pricingSummary = product.path("pricing").path("summary");
        BigDecimal price = decimal(pricingSummary.path("fromPrice"));
        String priceCurrency = text(pricingSummary, "currency");
        BigDecimal originalPrice = decimal(pricingSummary.path("fromPriceOriginal"));
        Integer durationMinutes = readDurationMinutes(product.path("itinerary"));
        String destinationRef = readLocationName(product.path("destinations"));
        String locationName = (destinationIdToName != null && destinationRef != null && destinationIdToName.containsKey(destinationRef))
            ? destinationIdToName.get(destinationRef)
            : destinationRef;

        return new ExperienceSummaryResponse(
            syntheticId,
            productCode,
            name,
            description,
            null,
            null,
            CatalogSource.VIATOR,
            "VIATOR",
            imageUrl,
            price,
            priceCurrency,
            originalPrice,
            durationMinutes,
            rating,
            reviewCount,
            locationName,
            true
        );
    }

    /**
     * Map Viator product JSON to ExperienceDetailResponse for live API product fetch.
     */
    public ExperienceDetailResponse toDetailResponse(JsonNode product) {
        String productCode = text(product, "productCode");
        UUID syntheticId = productCode != null
            ? UUID.nameUUIDFromBytes(("viator-live-" + productCode).getBytes(StandardCharsets.UTF_8))
            : UUID.randomUUID();

        String name = firstNonBlank(text(product, "title"), productCode);
        String description = text(product, "description");
        String bookingUrl = text(product, "productUrl");

        BigDecimal rating = decimal(product.path("reviews").path("combinedAverageRating"));
        if (rating != null) {
            rating = rating.setScale(1, RoundingMode.HALF_UP);
        }
        Integer reviewCount = intValue(product.path("reviews").path("totalReviews"));

        List<String> imageUrls = readImageUrls(product.path("images"));
        String imageUrl = imageUrls.isEmpty() ? null : imageUrls.getFirst();

        JsonNode pricingSummary = product.path("pricing").path("summary");
        BigDecimal price = decimal(pricingSummary.path("fromPrice"));
        String priceCurrency = text(pricingSummary, "currency");
        BigDecimal originalPrice = decimal(pricingSummary.path("fromPriceOriginal"));
        Integer durationMinutes = readDurationMinutes(product.path("itinerary"));
        String locationName = readLocationName(product.path("destinations"));
        String cancellationPolicy = text(product.path("cancellationPolicy"), "description");
        String meetingPoint = readMeetingPoint(product.path("logistics"));
        List<String> highlights = readHighlights(product);
        List<String> inclusions = readInclusionExclusion(product.path("inclusions"));
        List<String> exclusions = readInclusionExclusion(product.path("exclusions"));
        List<String> languages = readLanguages(product.path("languageGuides"));
        Integer minParticipants = readMinParticipants(product.path("pricingInfo"));
        Integer maxParticipants = readMaxParticipants(product.path("pricingInfo"));

        return new ExperienceDetailResponse(
            syntheticId,
            name,
            description,
            null,
            null,
            CatalogSource.VIATOR,
            List.of(),
            List.of(),
            Instant.EPOCH,
            Instant.EPOCH,
            "VIATOR",
            productCode,
            price,
            priceCurrency,
            originalPrice,
            durationMinutes,
            imageUrl,
            imageUrls,
            bookingUrl,
            rating,
            reviewCount,
            null,
            null,
            locationName,
            highlights,
            inclusions,
            exclusions,
            languages,
            cancellationPolicy,
            meetingPoint,
            minParticipants,
            maxParticipants,
            null,
            true
        );
    }

    private List<String> readImageUrls(JsonNode imagesNode) {
        if (!imagesNode.isArray()) {
            return List.of();
        }

        Set<String> orderedUrls = new LinkedHashSet<>();
        String coverUrl = null;
        for (JsonNode image : imagesNode) {
            JsonNode variants = image.path("variants");
            String bestVariantUrl = selectLargestVariantUrl(variants);
            if (isBlank(bestVariantUrl)) {
                continue;
            }
            orderedUrls.add(bestVariantUrl);
            if (coverUrl == null && image.path("isCover").asBoolean(false)) {
                coverUrl = bestVariantUrl;
            }
        }

        List<String> urls = new ArrayList<>(orderedUrls);
        if (coverUrl != null) {
            urls.remove(coverUrl);
            urls.addFirst(coverUrl);
        }
        return urls;
    }

    private String selectLargestVariantUrl(JsonNode variantsNode) {
        if (!variantsNode.isArray()) {
            return null;
        }
        String bestUrl = null;
        long bestPixels = -1;
        for (JsonNode variant : variantsNode) {
            String url = text(variant, "url");
            if (isBlank(url)) {
                continue;
            }
            long width = variant.path("width").asLong(0);
            long height = variant.path("height").asLong(0);
            long pixels = width * height;
            if (pixels > bestPixels) {
                bestPixels = pixels;
                bestUrl = url;
            }
        }
        return bestUrl;
    }

    private List<String> readLanguages(JsonNode languageGuidesNode) {
        if (!languageGuidesNode.isArray()) {
            return List.of();
        }
        Set<String> languages = new LinkedHashSet<>();
        for (JsonNode guide : languageGuidesNode) {
            String language = text(guide, "language");
            if (!isBlank(language)) {
                languages.add(language);
            }
        }
        return new ArrayList<>(languages);
    }

    private List<String> readInclusionExclusion(JsonNode itemsNode) {
        if (!itemsNode.isArray()) {
            return List.of();
        }
        Set<String> seen = new LinkedHashSet<>();
        for (JsonNode item : itemsNode) {
            String normalized = firstNonBlank(
                text(item, "categoryDescription"),
                text(item, "typeDescription"),
                text(item, "otherDescription"),
                text(item, "type"),
                text(item, "category")
            );
            if (!isBlank(normalized)) {
                seen.add(normalized);
            }
        }
        return new ArrayList<>(seen);
    }

    private List<String> readHighlights(JsonNode product) {
        Set<String> highlights = new LinkedHashSet<>();

        JsonNode additionalInfo = product.path("additionalInfo");
        if (additionalInfo.isArray()) {
            for (JsonNode info : additionalInfo) {
                String description = text(info, "description");
                if (!isBlank(description)) {
                    highlights.add(description);
                }
            }
        }

        JsonNode itinerary = product.path("itinerary");
        String unstructuredDescription = firstNonBlank(
            text(itinerary, "unstructuredDescription"),
            text(itinerary, "unstructuredItinerary")
        );
        if (!isBlank(unstructuredDescription)) {
            highlights.add(unstructuredDescription);
        }

        return new ArrayList<>(highlights);
    }

    private String readMeetingPoint(JsonNode logisticsNode) {
        if (!logisticsNode.isObject()) {
            return null;
        }
        JsonNode startNode = logisticsNode.path("start");
        if (startNode.isArray()) {
            for (JsonNode start : startNode) {
                String description = text(start, "description");
                if (!isBlank(description)) {
                    return description;
                }
            }
        }
        return null;
    }

    private String readLocationName(JsonNode destinationsNode) {
        if (!destinationsNode.isArray()) {
            return null;
        }
        for (JsonNode destination : destinationsNode) {
            String ref = text(destination, "ref");
            if (!isBlank(ref)) {
                return ref;
            }
        }
        return null;
    }

    private Integer readDurationMinutes(JsonNode itineraryNode) {
        if (!itineraryNode.isObject()) {
            return null;
        }
        JsonNode duration = itineraryNode.path("duration");
        if (!duration.isObject()) {
            return null;
        }

        Integer fixed = intValue(duration.path("fixedDurationInMinutes"));
        if (fixed != null) {
            return fixed;
        }

        return intValue(duration.path("variableDurationFromMinutes"));
    }

    private Integer readMinParticipants(JsonNode pricingInfoNode) {
        return readTravelerLimit(pricingInfoNode, "minTravelersPerBooking", true);
    }

    private Integer readMaxParticipants(JsonNode pricingInfoNode) {
        return readTravelerLimit(pricingInfoNode, "maxTravelersPerBooking", false);
    }

    private Integer readTravelerLimit(JsonNode pricingInfoNode, String field, boolean readMin) {
        JsonNode ageBands = pricingInfoNode.path("ageBands");
        if (!ageBands.isArray()) {
            return null;
        }

        Integer value = null;
        for (JsonNode ageBand : ageBands) {
            Integer candidate = intValue(ageBand.path(field));
            if (candidate == null) {
                continue;
            }
            if (value == null) {
                value = candidate;
                continue;
            }
            value = readMin ? Math.min(value, candidate) : Math.max(value, candidate);
        }
        return value;
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node.path(field);
        if (value.isMissingNode() || value.isNull()) {
            return null;
        }
        String text = value.asText();
        return isBlank(text) ? null : text;
    }

    private Integer intValue(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        if (node.isIntegralNumber()) {
            return node.asInt();
        }
        if (node.isTextual()) {
            try {
                return Integer.parseInt(node.asText().trim());
            } catch (NumberFormatException ex) {
                return null;
            }
        }
        return null;
    }

    private BigDecimal decimal(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        if (node.isNumber()) {
            return node.decimalValue();
        }
        if (node.isTextual()) {
            try {
                return new BigDecimal(node.asText().trim());
            } catch (NumberFormatException ex) {
                return null;
            }
        }
        return null;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (!isBlank(value)) {
                return value;
            }
        }
        return null;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
