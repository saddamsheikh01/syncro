package com.syncro.backend.domain.zyra.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

/**
 * Birth chart placements (from astrology calculation). Zyra translates these into human-readable text.
 */
public record ZyraBirthChartInterpretationRequest(
    @NotNull @Valid PlacementInput sun,
    @NotNull @Valid PlacementInput moon,
    @Valid PlacementInput ascendant,
    @NotNull @Valid PlacementInput venus,
    @NotNull @Valid PlacementInput mars
) {
    public record PlacementInput(String sign, double degreeInSign) {}
}
