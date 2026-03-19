package com.syncro.backend.domain.relocation.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record CityDatasetSummaryResponse(
        UUID id,
        String cityName,
        String citySlug,
        String country,
        String countryCode,
        BigDecimal macroCostoVita,
        BigDecimal macroMercatoImmobiliare,
        BigDecimal macroPotereEconomico,
        BigDecimal macroQualitaVita,
        BigDecimal macroOpportunitaLavorative,
        BigDecimal macroIntegrazioneSociale,
        Boolean active
) {}
