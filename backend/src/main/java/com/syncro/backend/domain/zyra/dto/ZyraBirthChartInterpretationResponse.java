package com.syncro.backend.domain.zyra.dto;

/**
 * Zyra's human-readable interpretation of a birth chart (no calculations; translation of numeric placements only).
 */
public record ZyraBirthChartInterpretationResponse(String interpretation) {
}
