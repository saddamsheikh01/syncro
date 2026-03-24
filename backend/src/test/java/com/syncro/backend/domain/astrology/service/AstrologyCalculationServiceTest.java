package com.syncro.backend.domain.astrology.service;

import com.syncro.backend.domain.astrology.dto.AstrologyCalculationRequest;
import com.syncro.backend.domain.astrology.dto.AstrologyCalculationResponse;
import com.syncro.backend.domain.profile.entity.ZodiacSign;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalTime;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Astrology calculation tests. They instantiate the service directly to avoid booting the full
 * Spring app and depending on the development datasource.
 */
class AstrologyCalculationServiceTest {

    private final AstrologyCalculationService astrologyCalculationService =
        new AstrologyCalculationService(Path.of("ephe").toAbsolutePath().toString());

    @Test
    @DisplayName("AstrologyCalculationService can be instantiated with local ephemeris path")
    void serviceCanBeConstructed() {
        assertThat(astrologyCalculationService).isNotNull();
    }

    @Test
    @DisplayName("Calculate returns Sun, Moon, Venus, Mars and optionally Ascendant")
    void calculateReturnsPlacements() {
        AstrologyCalculationRequest request = new AstrologyCalculationRequest(
            LocalDate.of(1990, 6, 15),
            LocalTime.of(14, 30),
            41.9028,
            12.4964,
            "Europe/Rome"
        );
        AstrologyCalculationResponse response = astrologyCalculationService.calculate(request);
        assertThat(response).isNotNull();
        assertThat(response.sun()).isNotNull();
        assertThat(response.moon()).isNotNull();
        assertThat(response.venus()).isNotNull();
        assertThat(response.mars()).isNotNull();
        assertThat(response.ascendant()).isNotNull();
        assertThat(response.hasBirthTime()).isTrue();
        assertThat(response.sun().sign()).isNotEqualTo(ZodiacSign.UNKNOWN);
    }

    @Test
    @DisplayName("Without birth time, Ascendant is null and hasBirthTime is false")
    void withoutBirthTimeNoAscendant() {
        AstrologyCalculationRequest request = new AstrologyCalculationRequest(
            LocalDate.of(1985, 3, 20),
            null,
            45.4642,
            9.1900,
            null
        );
        AstrologyCalculationResponse response = astrologyCalculationService.calculate(request);
        assertThat(response).isNotNull();
        assertThat(response.ascendant()).isNull();
        assertThat(response.hasBirthTime()).isFalse();
        assertThat(response.sun()).isNotNull();
        assertThat(response.moon()).isNotNull();
    }
}
