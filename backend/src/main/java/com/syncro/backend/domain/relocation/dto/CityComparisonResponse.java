package com.syncro.backend.domain.relocation.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record CityComparisonResponse(
        CityInfo currentCity,
        CityInfo targetCity,
        List<MacroareaComparison> macroareeComparison,
        EconomicImpact economicImpact,
        PriorityAlignment priorityAlignment,
        List<TradeOff> tradeOffs,
        OverallImpact overallImpact,
        Map<String, Double> userWeights,
        Map<String, String> userPriorityClassification,
        String algorithmVersion
) {

    public record CityInfo(
            UUID id,
            String name,
            String country,
            String slug
    ) {}

    public record MacroareaComparison(
            String macroarea,
            BigDecimal currentCityScore,
            BigDecimal targetCityScore,
            BigDecimal delta,
            String direction
    ) {}

    public record EconomicImpact(
            BigDecimal currentCityCost,
            BigDecimal targetCityCost,
            BigDecimal monthlySaving,
            boolean isFamily,
            String summary
    ) {}

    public record PriorityAlignment(
            List<String> alignedPriorities,
            String summary
    ) {}

    public record TradeOff(
            String macroarea,
            String message
    ) {}

    public record OverallImpact(
            String summary,
            int scoreCurrentCity,
            int scoreTargetCity,
            String compatibilityLevelCurrent,
            String compatibilityLevelTarget
    ) {}
}
