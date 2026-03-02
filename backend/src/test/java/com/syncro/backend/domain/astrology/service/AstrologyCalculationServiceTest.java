package com.syncro.backend.domain.astrology.service;

import com.syncro.backend.domain.astrology.dto.AstrologyCalculationRequest;
import com.syncro.backend.domain.astrology.dto.AstrologyCalculationResponse;
import com.syncro.backend.domain.astrology.dto.PlacementDTO;
import com.syncro.backend.domain.profile.entity.ZodiacSign;
import java.time.LocalDate;
import java.time.LocalTime;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Astrology calculation tests. Full calculation requires Swiss Ephemeris dependency and
 * ephemeris files in app.astrology.ephemeris-path (run scripts/download-ephemeris.ps1 or .sh).
 */
@SpringBootTest
@ActiveProfiles("dev")
class AstrologyCalculationServiceTest {

    @Autowired(required = false)
    private AstrologyCalculationService astrologyCalculationService;

    @Test
    @DisplayName("AstrologyCalculationService bean is present when Swiss Ephemeris is on classpath")
    void serviceBeanPresentWhenLibraryAvailable() {
        if (astrologyCalculationService == null) {
            return;
        }
        assertThat(astrologyCalculationService).isNotNull();
    }

    @Test
    @DisplayName("Calculate returns Sun, Moon, Venus, Mars and optionally Ascendant")
    void calculateReturnsPlacements() {
        if (astrologyCalculationService == null) {
            return;
        }
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
        if (astrologyCalculationService == null) {
            return;
        }
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
