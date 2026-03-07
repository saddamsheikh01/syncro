package com.syncro.backend.domain.external.viator.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Result of searching Viator products by free-text search term (e.g. city name).
 * Chains searchDestinationsByTerm + searchProductsByDestination.
 * destinationIdToName: map from destination id (from freetext response) to display name for locationName.
 */
public record ViatorProductSearchByTermResult(
    List<JsonNode> products,
    int totalCount,
    Map<String, String> destinationIdToName
) {
    public ViatorProductSearchByTermResult(List<JsonNode> products, int totalCount) {
        this(products, totalCount, Collections.emptyMap());
    }
}
