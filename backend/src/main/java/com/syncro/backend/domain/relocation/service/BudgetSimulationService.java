package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.relocation.dto.BudgetSimulationResponse;
import com.syncro.backend.domain.relocation.dto.CreateBudgetSimulationRequest;
import com.syncro.backend.domain.relocation.entity.BudgetSimulation;
import com.syncro.backend.domain.relocation.entity.RelocationCityDataset;
import com.syncro.backend.domain.relocation.entity.RelocationProfile;
import com.syncro.backend.domain.relocation.entity.RelocationScoringConfig;
import com.syncro.backend.domain.relocation.mapper.RelocationMapper;
import com.syncro.backend.domain.relocation.repository.BudgetSimulationRepository;
import com.syncro.backend.domain.relocation.repository.RelocationCityDatasetRepository;
import com.syncro.backend.domain.relocation.repository.RelocationProfileRepository;
import com.syncro.backend.domain.relocation.repository.RelocationScoringConfigRepository;
import com.syncro.backend.domain.analytics.service.AnalyticsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BudgetSimulationService {

    private final BudgetSimulationRepository simulationRepository;
    private final RelocationProfileRepository profileRepository;
    private final RelocationCityDatasetRepository cityDatasetRepository;
    private final RelocationScoringConfigRepository scoringConfigRepository;
    private final ScoringCalculationHelper scoringHelper;
    private final RelocationMapper mapper;
    private final AnalyticsService analyticsService;

    public BudgetSimulationService(BudgetSimulationRepository simulationRepository,
                                    RelocationProfileRepository profileRepository,
                                    RelocationCityDatasetRepository cityDatasetRepository,
                                    RelocationScoringConfigRepository scoringConfigRepository,
                                    ScoringCalculationHelper scoringHelper,
                                    RelocationMapper mapper,
                                    AnalyticsService analyticsService) {
        this.simulationRepository = simulationRepository;
        this.profileRepository = profileRepository;
        this.cityDatasetRepository = cityDatasetRepository;
        this.scoringConfigRepository = scoringConfigRepository;
        this.scoringHelper = scoringHelper;
        this.mapper = mapper;
        this.analyticsService = analyticsService;
    }

    @Transactional
    public BudgetSimulationResponse runSimulation(User user, CreateBudgetSimulationRequest request) {
        String planCode = request.planCode().toUpperCase();
        if (!List.of("FREE", "PREMIUM", "SUPER_PRO").contains(planCode)) {
            throw new BadRequestException("Piano non valido: " + planCode);
        }

        RelocationProfile profile = profileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new NotFoundException("Profilo relocation non trovato"));

        RelocationCityDataset city = resolveCity(request.cityId(), profile);
        RelocationScoringConfig config = scoringConfigRepository.findByConfigKeyAndActiveTrue("city_scoring_v1")
                .orElseThrow(() -> new NotFoundException("Configurazione scoring non trovata"));

        Map<String, Object> inputPayload = buildInputPayload(request, profile, planCode);
        Map<String, Object> outputPayload = switch (planCode) {
            case "FREE" -> computeFreeOutput(city, profile, config, inputPayload);
            case "PREMIUM" -> computePremiumOutput(city, profile, config, inputPayload, request);
            case "SUPER_PRO" -> computeSuperProOutput(city, profile, config, inputPayload, request);
            default -> throw new BadRequestException("Piano non valido");
        };

        BudgetSimulation simulation = new BudgetSimulation();
        simulation.setUser(user);
        simulation.setCity(city);
        simulation.setScenario(profile.getUserType());
        simulation.setPlanCode(planCode);
        simulation.setInputPayload(inputPayload);
        simulation.setOutputPayload(outputPayload);

        simulation = simulationRepository.save(simulation);
        analyticsService.trackServerEventSafe(user.getId(), "BUDGET_SIMULATION_RUN",
                Map.of("planCode", planCode, "simulationId", simulation.getId().toString()));
        return mapper.toBudgetSimulationResponse(simulation);
    }

    @Transactional(readOnly = true)
    public List<BudgetSimulationResponse> getSimulations(User user) {
        return simulationRepository.findByUser_IdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(mapper::toBudgetSimulationResponse)
                .collect(Collectors.toList());
    }

    private RelocationCityDataset resolveCity(UUID cityId, RelocationProfile profile) {
        if (cityId != null) {
            return cityDatasetRepository.findById(cityId)
                    .orElseThrow(() -> new NotFoundException("Citta non trovata"));
        }
        if (profile.getTargetCity() != null) {
            return profile.getTargetCity();
        }
        throw new BadRequestException("Nessuna citta specificata e nessuna citta target nel profilo");
    }

    private Map<String, Object> buildInputPayload(CreateBudgetSimulationRequest request,
                                                     RelocationProfile profile,
                                                     String planCode) {
        Map<String, Object> input = new LinkedHashMap<>();
        BigDecimal budget = request.monthlyBudget() != null ? request.monthlyBudget() : profile.getMonthlyBudget();
        input.put("monthlyBudget", budget);
        input.put("household", request.household() != null ? request.household() : profile.getHousehold());
        input.put("desiredLifestyle", request.desiredLifestyle() != null ? request.desiredLifestyle() : profile.getDesiredLifestyle());
        input.put("planCode", planCode);

        if ("PREMIUM".equals(planCode) || "SUPER_PRO".equals(planCode)) {
            if (request.monthlyIncome() != null) {
                input.put("monthlyIncome", request.monthlyIncome());
            }
        }
        if ("SUPER_PRO".equals(planCode) && request.projectionMonths() != null) {
            input.put("projectionMonths", request.projectionMonths());
        }
        return input;
    }

    private Map<String, Object> computeFreeOutput(RelocationCityDataset city,
                                                     RelocationProfile profile,
                                                     RelocationScoringConfig config,
                                                     Map<String, Object> input) {
        boolean isFamily = scoringHelper.isFamily(input);
        BigDecimal cityCost = scoringHelper.computeCityCost(city, isFamily);
        BigDecimal userBudget = (BigDecimal) input.get("monthlyBudget");
        BigDecimal lifestyleMultiplier = scoringHelper.getLifestyleMultiplier(input, config);
        BigDecimal adjustedBudget = userBudget.multiply(lifestyleMultiplier).setScale(2, RoundingMode.HALF_UP);
        BigDecimal margin = adjustedBudget.subtract(cityCost);
        String marginStatus = scoringHelper.classifyMarginStatus(margin, config);

        Map<String, Object> output = new LinkedHashMap<>();
        output.put("estimatedMonthlyCost", cityCost);
        output.put("adjustedBudget", adjustedBudget);
        output.put("margin", margin);
        output.put("marginStatus", marginStatus);
        output.put("isFamily", isFamily);
        output.put("cityName", city.getCityName());
        output.put("country", city.getCountry());
        return output;
    }

    private Map<String, Object> computePremiumOutput(RelocationCityDataset city,
                                                       RelocationProfile profile,
                                                       RelocationScoringConfig config,
                                                       Map<String, Object> input,
                                                       CreateBudgetSimulationRequest request) {
        Map<String, Object> output = computeFreeOutput(city, profile, config, input);

        BigDecimal cityCost = (BigDecimal) output.get("estimatedMonthlyCost");
        BigDecimal monthlyIncome = request.monthlyIncome();
        if (monthlyIncome == null || monthlyIncome.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Piano PREMIUM richiede monthlyIncome > 0");
        }

        BigDecimal stressIndex = cityCost.divide(monthlyIncome, 4, RoundingMode.HALF_UP);
        output.put("stressIndex", stressIndex);

        String stressLevel;
        double stress = stressIndex.doubleValue();
        if (stress <= 0.30) stressLevel = "LOW";
        else if (stress <= 0.50) stressLevel = "MODERATE";
        else if (stress <= 0.70) stressLevel = "HIGH";
        else stressLevel = "CRITICAL";
        output.put("stressLevel", stressLevel);

        Map<String, Object> breakdown = new LinkedHashMap<>();
        boolean isFamily = (boolean) output.get("isFamily");
        BigDecimal rent = isFamily ? city.getApartment3brCenter() : city.getApartment1brCenter();
        BigDecimal living = isFamily ? city.getCostFamilyNoRent() : city.getCostSingleNoRent();
        breakdown.put("rent", rent);
        breakdown.put("livingExpenses", living);
        breakdown.put("totalCost", cityCost);
        output.put("costBreakdown", breakdown);

        return output;
    }

    private Map<String, Object> computeSuperProOutput(RelocationCityDataset city,
                                                        RelocationProfile profile,
                                                        RelocationScoringConfig config,
                                                        Map<String, Object> input,
                                                        CreateBudgetSimulationRequest request) {
        Map<String, Object> output = computePremiumOutput(city, profile, config, input, request);

        int months = request.projectionMonths() != null ? request.projectionMonths() : 12;
        months = Math.min(months, 24);

        BigDecimal monthlyCost = (BigDecimal) output.get("estimatedMonthlyCost");
        BigDecimal monthlyIncome = request.monthlyIncome();
        BigDecimal monthlySaving = monthlyIncome.subtract(monthlyCost);

        List<Map<String, Object>> projections = new ArrayList<>();
        BigDecimal cumulativeSavings = BigDecimal.ZERO;
        for (int m = 1; m <= months; m++) {
            cumulativeSavings = cumulativeSavings.add(monthlySaving);
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("month", m);
            point.put("monthlySaving", monthlySaving.setScale(2, RoundingMode.HALF_UP));
            point.put("cumulativeSavings", cumulativeSavings.setScale(2, RoundingMode.HALF_UP));
            projections.add(point);
        }
        output.put("projections", projections);

        List<String> optimizationTips = new ArrayList<>();
        BigDecimal stressIndex = (BigDecimal) output.get("stressIndex");
        if (stressIndex.doubleValue() > 0.50) {
            optimizationTips.add("Consider shared accommodation to reduce rent by 30-40%");
            optimizationTips.add("Look for peripheral areas with lower rent index");
        }
        if (stressIndex.doubleValue() > 0.30) {
            optimizationTips.add("Track grocery spending - local markets can save 15-20%");
            optimizationTips.add("Use public transport instead of car ownership");
        }
        optimizationTips.add("Build a 3-month emergency fund before relocating");
        output.put("optimizationPlan", optimizationTips);

        List<String> safetyChecklist = new ArrayList<>();
        safetyChecklist.add("Verify health insurance coverage in " + city.getCountry());
        safetyChecklist.add("Research visa/permit requirements for " + city.getCountry());
        safetyChecklist.add("Open a local bank account within first 2 weeks");
        safetyChecklist.add("Register with local authorities (anmeldung/empadronamiento equivalent)");
        safetyChecklist.add("Secure temporary accommodation for first 30 days minimum");
        output.put("relocationSafetyPlan", safetyChecklist);

        return output;
    }
}
