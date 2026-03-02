package com.syncro.backend.domain.astrology.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Input for in-house astrology calculation (Swiss Ephemeris).
 * Date and place (lat/long) are required. Time is optional; when missing, Ascendant is not calculated.
 * Birth time is interpreted as LOCAL at the place of birth. For correct Ascendant, send birthTimezone (IANA, e.g. "Europe/Rome")
 * so the server can convert local time to UTC before calling Swiss Ephemeris.
 */
public record AstrologyCalculationRequest(
    @NotNull @Past LocalDate birthDate,
    LocalTime birthTime,
    @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") Double birthLatitude,
    @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") Double birthLongitude,
    /** IANA timezone of place of birth (e.g. "Europe/Rome"). Required for correct Ascendant when birthTime is set. */
    String birthTimezone
) {
}
