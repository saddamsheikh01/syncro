package com.syncro.backend.domain.astrology.dto;

import com.syncro.backend.domain.profile.entity.ZodiacSign;

/**
 * Zodiac placement: sign + degree within sign (0–30).
 */
public record PlacementDTO(
    ZodiacSign sign,
    double degreeInSign
) {
}
