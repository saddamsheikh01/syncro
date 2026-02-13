package com.syncro.backend.domain.external.viator.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;

public record ViatorProductsPage(
    List<JsonNode> products,
    String nextCursor
) {}
