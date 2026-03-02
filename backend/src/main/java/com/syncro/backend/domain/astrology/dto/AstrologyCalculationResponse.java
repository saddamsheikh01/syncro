package com.syncro.backend.domain.astrology.dto;

/**
 * Result of astrology calculation: Sun, Moon, Ascendant (if birth time given), Venus, Mars.
 * Each placement has zodiac sign and degree within sign.
 * interpretation is set only when returned from calculate-and-save (cached on profile for reuse).
 */
public record AstrologyCalculationResponse(
    PlacementDTO sun,
    PlacementDTO moon,
    PlacementDTO ascendant,
    PlacementDTO venus,
    PlacementDTO mars,
    boolean hasBirthTime,
    String interpretation
) {
    public AstrologyCalculationResponse(
        PlacementDTO sun,
        PlacementDTO moon,
        PlacementDTO ascendant,
        PlacementDTO venus,
        PlacementDTO mars,
        boolean hasBirthTime
    ) {
        this(sun, moon, ascendant, venus, mars, hasBirthTime, null);
    }
}
