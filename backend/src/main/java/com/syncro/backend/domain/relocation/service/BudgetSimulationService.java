package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.relocation.dto.BudgetSimulationResponse;
import com.syncro.backend.domain.relocation.dto.CreateBudgetSimulationRequest;
import com.syncro.backend.domain.relocation.entity.BudgetSimulation;
import com.syncro.backend.domain.relocation.entity.RelocationCityDataset;
import com.syncro.backend.domain.relocation.entity.RelocationProfile;
import com.syncro.backend.domain.relocation.mapper.RelocationMapper;
import com.syncro.backend.domain.relocation.repository.BudgetSimulationRepository;
import com.syncro.backend.domain.relocation.repository.RelocationCityDatasetRepository;
import com.syncro.backend.domain.relocation.repository.RelocationProfileRepository;
import com.syncro.backend.domain.expats.entity.ExpatsAnonymousSession;
import com.syncro.backend.domain.expats.repository.ExpatsAnonymousSessionRepository;
import com.syncro.backend.domain.relocation.dto.ComputeScoringRequest;
import com.syncro.backend.domain.analytics.service.AnalyticsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BudgetSimulationService {

    private static final Logger log = LoggerFactory.getLogger(BudgetSimulationService.class);

    private final BudgetSimulationRepository simulationRepository;
    private final RelocationProfileRepository profileRepository;
    private final RelocationCityDatasetRepository cityDatasetRepository;
    private final BudgetCalculationHelper calcHelper;
    private final RelocationMapper mapper;
    private final AnalyticsService analyticsService;
    private final UserRepository userRepository;
    private final SubscriptionService subscriptionService;
    private final RelocationProfileResolver profileResolver;
    private final AnonymousRelocationService anonymousRelocationService;
    private final ExpatsAnonymousSessionRepository sessionRepository;
    private final RelocationOnboardingService onboardingService;
    private final RelocationScoringService scoringService;

    public BudgetSimulationService(BudgetSimulationRepository simulationRepository,
                                    RelocationProfileRepository profileRepository,
                                    RelocationCityDatasetRepository cityDatasetRepository,
                                    BudgetCalculationHelper calcHelper,
                                    RelocationMapper mapper,
                                    AnalyticsService analyticsService,
                                    UserRepository userRepository,
                                    SubscriptionService subscriptionService,
                                    RelocationProfileResolver profileResolver,
                                    AnonymousRelocationService anonymousRelocationService,
                                    ExpatsAnonymousSessionRepository sessionRepository,
                                    RelocationOnboardingService onboardingService,
                                    RelocationScoringService scoringService) {
        this.simulationRepository = simulationRepository;
        this.profileRepository = profileRepository;
        this.cityDatasetRepository = cityDatasetRepository;
        this.calcHelper = calcHelper;
        this.mapper = mapper;
        this.analyticsService = analyticsService;
        this.userRepository = userRepository;
        this.subscriptionService = subscriptionService;
        this.profileResolver = profileResolver;
        this.anonymousRelocationService = anonymousRelocationService;
        this.sessionRepository = sessionRepository;
        this.onboardingService = onboardingService;
        this.scoringService = scoringService;
    }

    @Transactional
    public BudgetSimulationResponse runSimulation(UUID userId, CreateBudgetSimulationRequest request) {
        User user = userRepository.getReferenceById(userId);
        String planCode = request.planCode().toUpperCase();
        if (!List.of("FREE", "PREMIUM", "SUPER_PRO").contains(planCode)) {
            throw new BadRequestException("Piano non valido: " + planCode);
        }

        if (!subscriptionService.hasAccess(userId, planCode)) {
            throw new BadRequestException("Il tuo piano non include l'accesso a " + planCode + ". Effettua l'upgrade.");
        }

        RelocationProfile profile = profileResolver.findOrRecoverOptional(userId)
                .orElseGet(() -> createMinimalRegisteredProfile(user, request));

        RelocationCityDataset city = resolveCity(request.cityId(), profile);

        Map<String, Object> inputPayload = buildInputPayload(request, profile, planCode);
        Map<String, Object> outputPayload = switch (planCode) {
            case "FREE" -> computeFreeOutput(city, request, profile);
            case "PREMIUM" -> computePremiumOutput(city, request, profile);
            case "SUPER_PRO" -> computeSuperProOutput(city, request, profile);
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

        // Sync target city to profile if changed
        syncTargetCity(profile, city, userId);

        analyticsService.trackServerEventSafe(userId, "BUDGET_SIMULATION_RUN",
                Map.of("planCode", planCode, "simulationId", simulation.getId().toString()));
        return mapper.toBudgetSimulationResponse(simulation);
    }

    @Transactional(readOnly = true)
    public List<BudgetSimulationResponse> getSimulations(UUID userId) {
        return simulationRepository.findByUser_IdOrderByCreatedAtDesc(userId)
                .stream()
                .map(mapper::toBudgetSimulationResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BudgetSimulationResponse runAnonymousSimulation(UUID sessionId, CreateBudgetSimulationRequest request) {
        ExpatsAnonymousSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Sessione anonima non trovata"));

        // Profile is optional for anonymous — user may arrive without funnel
        RelocationProfile profile = profileRepository.findByAnonymousSession_Id(sessionId)
                .orElseGet(() -> buildMinimalProfile(request));

        RelocationCityDataset city = resolveCity(request.cityId(), profile);

        Map<String, Object> inputPayload = buildInputPayload(request, profile, "FREE");
        Map<String, Object> outputPayload = computeFreeOutput(city, request, profile);

        BudgetSimulation simulation = new BudgetSimulation();
        simulation.setAnonymousSession(session);
        simulation.setCity(city);
        simulation.setScenario(profile.getUserType());
        simulation.setPlanCode("FREE");
        simulation.setInputPayload(inputPayload);
        simulation.setOutputPayload(outputPayload);

        simulation = simulationRepository.save(simulation);
        analyticsService.trackServerEventSafe(null, "BUDGET_SIMULATION_RUN",
                Map.of("planCode", "FREE", "source", "anonymous",
                        "sessionId", sessionId.toString(),
                        "simulationId", simulation.getId().toString()));
        return mapper.toBudgetSimulationResponse(simulation);
    }

    // ========== FREE ==========

    private Map<String, Object> computeFreeOutput(RelocationCityDataset city,
                                                     CreateBudgetSimulationRequest req,
                                                     RelocationProfile profile) {
        String livingType = resolveLivingType(req, profile);
        String housingType = req.housingType() != null ? req.housingType() : (isFamily(livingType) ? "3br_center" : "1br_center");
        String location = req.location();

        BigDecimal rent = calcHelper.resolveRent(city, housingType, location);
        BigDecimal livingCost = calcHelper.resolveLivingCost(city, livingType);
        BigDecimal monthlyCost = rent.add(livingCost);

        BigDecimal monthlyBudget = req.monthlyBudget() != null ? req.monthlyBudget() : profile.getMonthlyBudget();
        BigDecimal monthlyIncome = req.monthlyIncome() != null ? req.monthlyIncome() : monthlyBudget;
        BigDecimal savings = req.savings();

        Map<String, Object> output = new LinkedHashMap<>();
        output.put("estimatedMonthlyCost", monthlyCost);
        output.put("rent", rent);
        output.put("livingCost", livingCost);
        output.put("livingType", livingType);
        output.put("housingType", housingType);
        output.put("cityName", city.getCityName());
        output.put("country", city.getCountry());

        // Entry cost
        Map<String, Object> entryCost = calcHelper.computeEntryCostFree(city, rent, livingType);
        output.put("entryCost", entryCost);

        // Monthly balance
        BigDecimal monthlyBalance = calcHelper.computeMonthlyBalance(monthlyIncome, monthlyCost);
        if (monthlyBalance != null) {
            output.put("monthlyBalance", monthlyBalance);
            output.put("balanceStatus", monthlyBalance.compareTo(BigDecimal.ZERO) >= 0 ? "POSITIVE" : "DEFICIT");
        }

        // Financial runway
        Map<String, Object> runway = calcHelper.computeFinancialRunway(savings, monthlyCost);
        if (runway != null) {
            output.put("financialRunway", runway);
        }

        // Recommended budget
        output.put("recommendedBudget", calcHelper.computeRecommendedBudget(monthlyCost));

        return output;
    }

    // ========== PREMIUM ==========

    private Map<String, Object> computePremiumOutput(RelocationCityDataset city,
                                                       CreateBudgetSimulationRequest req,
                                                       RelocationProfile profile) {
        if (req.monthlyIncome() == null || req.monthlyIncome().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Piano PREMIUM richiede monthlyIncome > 0");
        }

        Map<String, Object> output = computeFreeOutput(city, req, profile);
        BigDecimal monthlyCost = (BigDecimal) output.get("estimatedMonthlyCost");
        BigDecimal monthlyIncome = req.monthlyIncome();

        // Stress index
        BigDecimal stressIndex = monthlyCost.divide(monthlyIncome, 4, RoundingMode.HALF_UP);
        output.put("stressIndex", stressIndex);
        output.put("stressLevel", classifyStressLevel(stressIndex));

        // Cost breakdown
        Map<String, Object> breakdown = new LinkedHashMap<>();
        breakdown.put("rent", output.get("rent"));
        breakdown.put("livingExpenses", output.get("livingCost"));
        breakdown.put("totalCost", monthlyCost);
        output.put("costBreakdown", breakdown);

        // Entry cost premium (extends free)
        BigDecimal rent = (BigDecimal) output.get("rent");
        String livingType = (String) output.get("livingType");
        BigDecimal freeEntryTotal = (BigDecimal) ((Map<String, Object>) output.get("entryCost")).get("totalEntryCost");
        Map<String, Object> premiumEntry = calcHelper.computeEntryCostPremium(city, rent, livingType, freeEntryTotal);
        output.put("entryCost", premiumEntry);

        // Stability score
        BigDecimal monthlyBalance = (BigDecimal) output.get("monthlyBalance");
        Map<String, Object> runwayMap = (Map<String, Object>) output.get("financialRunway");
        BigDecimal runwayMonths = runwayMap != null ? (BigDecimal) runwayMap.get("months") : null;
        BigDecimal entryTotal = (BigDecimal) premiumEntry.get("totalEntryCost");
        BigDecimal budget = req.monthlyBudget() != null ? req.monthlyBudget() : profile.getMonthlyBudget();

        Map<String, Object> stability = calcHelper.computeStabilityScore(monthlyBalance, runwayMonths, entryTotal, budget);
        output.put("stabilityScore", stability);

        // AI insight summary (rule-based)
        int stabScore = (int) stability.get("score");
        output.put("aiInsight", calcHelper.generateInsightSummary(stabScore, runwayMonths, monthlyBalance));

        return output;
    }

    // ========== SUPER_PRO ==========

    @SuppressWarnings("unchecked")
    private Map<String, Object> computeSuperProOutput(RelocationCityDataset city,
                                                        CreateBudgetSimulationRequest req,
                                                        RelocationProfile profile) {
        Map<String, Object> output = computePremiumOutput(city, req, profile);
        BigDecimal monthlyCost = (BigDecimal) output.get("estimatedMonthlyCost");
        BigDecimal monthlyIncome = req.monthlyIncome();
        String livingType = (String) output.get("livingType");
        int numChildren = req.numberOfChildren() != null ? req.numberOfChildren() : 0;
        boolean hasPet = Boolean.TRUE.equals(req.hasPet());

        // Extra costs
        Map<String, Object> extraCosts = new LinkedHashMap<>();
        BigDecimal totalExtra = BigDecimal.ZERO;

        // Family cost override
        if (numChildren > 0) {
            BigDecimal familyCost = calcHelper.computeFamilyCost(city, numChildren, hasPet);
            extraCosts.put("familyCost", familyCost);
            totalExtra = totalExtra.add(familyCost.subtract(calcHelper.resolveLivingCost(city, livingType)));
        } else if (hasPet) {
            BigDecimal petCost = city.getCostSingleNoRent().multiply(new BigDecimal("0.12")).setScale(2, RoundingMode.HALF_UP);
            extraCosts.put("petCost", petCost);
            totalExtra = totalExtra.add(petCost);
        }

        // Schools
        BigDecimal schoolsCost = calcHelper.computeSchoolsCost(city, req.childrenAges());
        if (schoolsCost.compareTo(BigDecimal.ZERO) > 0) {
            extraCosts.put("schoolsCost", schoolsCost);
            totalExtra = totalExtra.add(schoolsCost);
        }

        // Eating out
        BigDecimal eatingOut = calcHelper.computeEatingOut(city, livingType, numChildren, req.eatingOutFrequency());
        if (eatingOut.compareTo(BigDecimal.ZERO) > 0) {
            extraCosts.put("eatingOut", eatingOut);
            totalExtra = totalExtra.add(eatingOut);
        }

        // Transport
        BigDecimal transport = calcHelper.computeTransport(city, req.transportMode(), isFamily(livingType));
        if (transport.compareTo(BigDecimal.ZERO) > 0) {
            extraCosts.put("transport", transport);
            totalExtra = totalExtra.add(transport);
        }

        // Leisure
        BigDecimal leisure = calcHelper.computeLeisure(city, livingType, numChildren, req.leisureLevel());
        if (leisure.compareTo(BigDecimal.ZERO) > 0) {
            extraCosts.put("leisure", leisure);
            totalExtra = totalExtra.add(leisure);
        }

        output.put("extraCosts", extraCosts);
        BigDecimal totalMonthlyCost = monthlyCost.add(totalExtra).setScale(2, RoundingMode.HALF_UP);
        output.put("totalMonthlyCostDetailed", totalMonthlyCost);

        // Time simulation
        BigDecimal entryTotal = (BigDecimal) ((Map<String, Object>) output.get("entryCost")).get("totalEntryCost");
        output.put("timeSimulation", calcHelper.computeTimeSimulation(req.savings(), entryTotal, monthlyIncome, totalMonthlyCost));

        // Optimization plan
        BigDecimal stressIndex = (BigDecimal) output.get("stressIndex");
        output.put("optimizationPlan", generateOptimizationPlan(stressIndex, city));

        // Safety plan
        output.put("relocationSafetyPlan", generateSafetyPlan(city));

        return output;
    }

    // ========== HELPERS ==========

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

    private Map<String, Object> buildInputPayload(CreateBudgetSimulationRequest req,
                                                     RelocationProfile profile, String planCode) {
        Map<String, Object> input = new LinkedHashMap<>();
        input.put("planCode", planCode);
        input.put("monthlyBudget", req.monthlyBudget() != null ? req.monthlyBudget() : profile.getMonthlyBudget());
        input.put("livingType", resolveLivingType(req, profile));
        input.put("housingType", req.housingType());
        input.put("location", req.location());
        if (req.monthlyIncome() != null) input.put("monthlyIncome", req.monthlyIncome());
        if (req.savings() != null) input.put("savings", req.savings());
        if (req.numberOfChildren() != null) input.put("numberOfChildren", req.numberOfChildren());
        if (req.childrenAges() != null) input.put("childrenAges", req.childrenAges());
        if (req.hasPet() != null) input.put("hasPet", req.hasPet());
        if (req.eatingOutFrequency() != null) input.put("eatingOutFrequency", req.eatingOutFrequency());
        if (req.transportMode() != null) input.put("transportMode", req.transportMode());
        if (req.leisureLevel() != null) input.put("leisureLevel", req.leisureLevel());
        if (req.projectionMonths() != null) input.put("projectionMonths", req.projectionMonths());
        return input;
    }

    private String resolveLivingType(CreateBudgetSimulationRequest req, RelocationProfile profile) {
        if (req.livingType() != null) return req.livingType();
        String household = req.household() != null ? req.household() : profile.getHousehold();
        if (household == null) return "single";
        if (household.contains("children") || household.contains("family")) return "family";
        if (household.contains("partner") || household.contains("couple")) return "couple";
        return "single";
    }

    private boolean isFamily(String livingType) {
        return "family".equals(livingType);
    }

    private String classifyStressLevel(BigDecimal stressIndex) {
        double s = stressIndex.doubleValue();
        if (s <= 0.30) return "LOW";
        if (s <= 0.50) return "MODERATE";
        if (s <= 0.70) return "HIGH";
        return "CRITICAL";
    }

    private List<String> generateOptimizationPlan(BigDecimal stressIndex, RelocationCityDataset city) {
        List<String> tips = new ArrayList<>();
        if (stressIndex.doubleValue() > 0.50) {
            tips.add("Consider shared accommodation to reduce rent by 30-40%");
            tips.add("Look for peripheral areas with lower rent index");
        }
        if (stressIndex.doubleValue() > 0.30) {
            tips.add("Track grocery spending - local markets can save 15-20%");
            tips.add("Use public transport instead of car ownership");
        }
        tips.add("Build a 3-month emergency fund before relocating");
        return tips;
    }

    private void syncTargetCity(RelocationProfile profile, RelocationCityDataset city, UUID userId) {
        if (profile.getId() == null) return; // minimal profile, not persisted
        UUID currentTargetId = profile.getTargetCity() != null ? profile.getTargetCity().getId() : null;
        if (city.getId().equals(currentTargetId)) return; // same city, no update

        // 1. Update target city on profile
        profile.setTargetCity(city);
        profile.setTargetCityName(city.getCityName());
        profile.setTargetCountry(city.getCountry());
        profileRepository.save(profile);

        // 2. Auto-refresh snapshot + scoring if profile is completed
        if ("COMPLETED".equals(profile.getStatus())) {
            try {
                onboardingService.createSnapshot(userId);
                ComputeScoringRequest scoringReq = new ComputeScoringRequest(city.getId(), null);
                scoringService.computeScoring(userId, scoringReq);
                log.info("Auto-refreshed snapshot and scoring for user {} after target city change to {}", userId, city.getCityName());
            } catch (Exception e) {
                log.warn("Failed to auto-refresh scoring after city change for user {}: {}", userId, e.getMessage());
            }
        }
    }

    private RelocationProfile createMinimalRegisteredProfile(User user, CreateBudgetSimulationRequest req) {
        RelocationProfile profile = buildMinimalProfile(req);
        profile.setUser(user);
        profile = profileRepository.save(profile);
        log.info("Created minimal relocation profile {} for user {} from budget simulation", profile.getId(), user.getId());
        return profile;
    }

    private RelocationProfile buildMinimalProfile(CreateBudgetSimulationRequest req) {
        RelocationProfile p = new RelocationProfile();
        p.setUserType("planning_move");
        p.setHousehold(req.household() != null ? req.household() : "alone");
        p.setHasPets(req.hasPet() != null ? req.hasPet() : false);
        p.setMonthlyBudget(req.monthlyBudget() != null ? req.monthlyBudget() : java.math.BigDecimal.ZERO);
        p.setPrimaryGoal("quality_of_life");
        p.setSocialPriority("medium");
        p.setDesiredLifestyle(req.desiredLifestyle() != null ? req.desiredLifestyle() : "balanced");
        p.setWorkStatus("employed");
        p.setIsRemote(false);
        p.setPriorityProblem("monthly_costs");
        p.setCompletedSteps(0);
        p.setCompletionPercent(0);
        p.setStatus("IN_PROGRESS");
        return p;
    }

    private List<String> generateSafetyPlan(RelocationCityDataset city) {
        List<String> plan = new ArrayList<>();
        plan.add("Verify health insurance coverage in " + city.getCountry());
        plan.add("Research visa/permit requirements for " + city.getCountry());
        plan.add("Open a local bank account within first 2 weeks");
        plan.add("Register with local authorities");
        plan.add("Secure temporary accommodation for first 30 days minimum");
        return plan;
    }
}
