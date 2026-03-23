package com.syncro.backend.domain.relocation.mapper;

import com.syncro.backend.domain.relocation.dto.*;
import com.syncro.backend.domain.relocation.entity.*;
import org.springframework.stereotype.Component;

@Component
public class RelocationMapper {

    public OnboardingResponse toOnboardingResponse(RelocationProfile profile) {
        return new OnboardingResponse(
                profile.getId(),
                profile.getUserType(),
                profile.getTargetCityName(),
                profile.getTargetCountry(),
                profile.getTargetCity() != null ? profile.getTargetCity().getId() : null,
                profile.getCurrentCity() != null ? profile.getCurrentCity().getId() : null,
                profile.getCurrentCityName(),
                profile.getHousehold(),
                profile.getHasPets(),
                profile.getChildrenAgeRange(),
                profile.getMonthlyBudget(),
                profile.getPrimaryGoal(),
                profile.getSocialPriority(),
                profile.getDesiredLifestyle(),
                profile.getWorkStatus(),
                profile.getIsRemote(),
                profile.getPriorityProblem(),
                profile.getFreeNotes(),
                profile.getCompletedSteps(),
                profile.getCompletionPercent(),
                profile.getStatus(),
                profile.getCreatedAt(),
                profile.getUpdatedAt()
        );
    }

    public OnboardingStatusResponse toOnboardingStatusResponse(RelocationProfile profile,
                                                                boolean hasActiveSnapshot,
                                                                Integer latestSnapshotVersion) {
        return new OnboardingStatusResponse(
                profile.getStatus(),
                profile.getCompletedSteps(),
                profile.getCompletionPercent(),
                profile.getUserType(),
                hasActiveSnapshot,
                latestSnapshotVersion,
                profile.getUpdatedAt()
        );
    }

    public SnapshotResponse toSnapshotResponse(RelocationOnboardingSnapshot snapshot) {
        return new SnapshotResponse(
                snapshot.getId(),
                snapshot.getVersion(),
                snapshot.getIsActive(),
                snapshot.getPayload(),
                snapshot.getCreatedAt()
        );
    }

    public CityDatasetResponse toCityDatasetResponse(RelocationCityDataset city) {
        return new CityDatasetResponse(
                city.getId(),
                city.getCityName(),
                city.getCitySlug(),
                city.getCountry(),
                city.getCountryCode(),
                city.getExpatCommunityIndex(),
                city.getSocialIntegrationIndex(),
                city.getCareerOpportunityIndex(),
                city.getRemoteWorkEcosystemIndex(),
                city.getRentIndex(),
                city.getPurchasingPowerIndex(),
                city.getGroceriesIndex(),
                city.getRestaurantIndex(),
                city.getCostOfLivingExRentIndex(),
                city.getCostOfLivingIncRentIndex(),
                city.getPriceToIncomeRatio(),
                city.getPriceToRentCityCenterRatio(),
                city.getSafetyIndex(),
                city.getHealthcareIndex(),
                city.getClimateIndex(),
                city.getPollutionIndex(),
                city.getTrafficCommuteIndex(),
                city.getApartment1brCenter(),
                city.getApartment3brCenter(),
                city.getCostSingleNoRent(),
                city.getCostFamilyNoRent(),
                city.getApartment1brOutside(),
                city.getApartment3brOutside(),
                city.getUtilitiesMonthly(),
                city.getMobilePlanMonthly(),
                city.getInternetMonthly(),
                city.getMealForTwoMidrange(),
                city.getGasolinePerLiter(),
                city.getPublicTransportMonthly(),
                city.getPreschoolMonthly(),
                city.getInternationalSchoolAnnual(),
                city.getMacroCostoVita(),
                city.getMacroMercatoImmobiliare(),
                city.getMacroPotereEconomico(),
                city.getMacroQualitaVita(),
                city.getMacroOpportunitaLavorative(),
                city.getMacroIntegrazioneSociale(),
                city.getDistricts(),
                city.getImageUrl(),
                city.getActive(),
                city.getCreatedAt(),
                city.getUpdatedAt()
        );
    }

    public CityDatasetSummaryResponse toCityDatasetSummaryResponse(RelocationCityDataset city) {
        return new CityDatasetSummaryResponse(
                city.getId(),
                city.getCityName(),
                city.getCitySlug(),
                city.getCountry(),
                city.getCountryCode(),
                city.getMacroCostoVita(),
                city.getMacroMercatoImmobiliare(),
                city.getMacroPotereEconomico(),
                city.getMacroQualitaVita(),
                city.getMacroOpportunitaLavorative(),
                city.getMacroIntegrazioneSociale(),
                city.getActive()
        );
    }

    public CityScoreResponse toCityScoreResponse(RelocationCityScore score) {
        RelocationCityDataset city = score.getCity();
        return new CityScoreResponse(
                score.getId(),
                score.getSnapshot() != null ? score.getSnapshot().getId() : null,
                city != null ? city.getId() : null,
                city != null ? city.getCityName() : null,
                city != null ? city.getCountry() : null,
                score.getAnalysisType(),
                score.getScoreTotal(),
                score.getCompatibilityLevel(),
                score.getBreakdown(),
                score.getUserWeights(),
                score.getUserPriorityClassification(),
                score.getRadarValues(),
                score.getBudgetCheck(),
                score.getIntegrationBreakdown(),
                score.getInsights(),
                score.getAlgorithmVersion(),
                score.getRankingPosition(),
                score.getComputedAt()
        );
    }

    public WeightRuleResponse toWeightRuleResponse(RelocationWeightRule rule) {
        return new WeightRuleResponse(
                rule.getId(),
                rule.getQuestionKey(),
                rule.getAnswerValue(),
                rule.getWeightAdjustments(),
                rule.getActive(),
                rule.getCreatedAt(),
                rule.getUpdatedAt()
        );
    }

    public WaitingListResponse toWaitingListResponse(RelocationCityWaitingList entry) {
        return new WaitingListResponse(
                entry.getId(),
                entry.getEmail(),
                entry.getCityName(),
                entry.getNotified(),
                entry.getCreatedAt()
        );
    }

    public ScoringConfigResponse toScoringConfigResponse(RelocationScoringConfig config) {
        return new ScoringConfigResponse(
                config.getId(),
                config.getConfigKey(),
                config.getThresholds(),
                config.getBudgetMarginThresholds(),
                config.getBudgetPenaltyThresholds(),
                config.getLifestyleMultipliers(),
                config.getPriorityThresholds(),
                config.getCityPerformanceThresholds(),
                config.getActive(),
                config.getCreatedAt(),
                config.getUpdatedAt()
        );
    }

    // ========== Sprint 2 Mappers ==========

    public BudgetSimulationResponse toBudgetSimulationResponse(BudgetSimulation sim) {
        RelocationCityDataset city = sim.getCity();
        return new BudgetSimulationResponse(
                sim.getId(),
                city != null ? city.getId() : null,
                city != null ? city.getCityName() : null,
                sim.getScenario(),
                sim.getPlanCode(),
                sim.getInputPayload(),
                sim.getOutputPayload(),
                sim.getAlgorithmVersion(),
                sim.getCreatedAt()
        );
    }

    public BudgetTrackingResponse toBudgetTrackingResponse(BudgetTrackingEntry entry) {
        return new BudgetTrackingResponse(
                entry.getId(),
                entry.getSimulation() != null ? entry.getSimulation().getId() : null,
                entry.getCategory(),
                entry.getExpectedValue(),
                entry.getActualValue(),
                entry.getDelta(),
                entry.getThreshold(),
                entry.getAlertStatus(),
                entry.getRecordedAt(),
                entry.getCreatedAt()
        );
    }

    public StarterKitResponse toStarterKitResponse(StarterKitReport report) {
        java.util.List<StarterKitActionResponse> actionResponses = report.getActions() != null
                ? report.getActions().stream().map(this::toStarterKitActionResponse).toList()
                : java.util.List.of();
        return new StarterKitResponse(
                report.getId(),
                report.getCity() != null ? report.getCity().getId() : null,
                report.getScenario(),
                report.getPlanCode(),
                report.getPayload(),
                actionResponses,
                report.getCreatedAt()
        );
    }

    public StarterKitActionResponse toStarterKitActionResponse(StarterKitAction action) {
        return new StarterKitActionResponse(
                action.getId(),
                action.getActionOrder(),
                action.getTitle(),
                action.getDescription(),
                action.getCategory()
        );
    }

    public RiskSnapshotResponse toRiskSnapshotResponse(RelocationRiskSnapshot snapshot) {
        return new RiskSnapshotResponse(
                snapshot.getId(),
                snapshot.getScenario(),
                snapshot.getSourceType(),
                snapshot.getRiskIndicators(),
                snapshot.getBurnoutIndex(),
                snapshot.getOverallRiskLevel(),
                snapshot.getCreatedAt()
        );
    }

    public MicroTestNextResponse toMicroTestNextResponse(MicroTestAssignment assignment) {
        var test = assignment.getTestDefinition();
        return new MicroTestNextResponse(
                assignment.getId(),
                test != null ? test.getId() : null,
                test != null ? test.getTitle() : null,
                test != null ? test.getDescription() : null,
                assignment.getStatus(),
                assignment.getAvailableFrom(),
                assignment.getExpiresAt()
        );
    }
}
