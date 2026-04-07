package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.relocation.dto.GenerateStarterKitRequest;
import com.syncro.backend.domain.relocation.dto.StarterKitResponse;
import com.syncro.backend.domain.relocation.entity.*;
import com.syncro.backend.domain.relocation.mapper.RelocationMapper;
import com.syncro.backend.domain.relocation.repository.*;
import com.syncro.backend.domain.analytics.service.AnalyticsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
public class StarterKitService {

    private final StarterKitReportRepository reportRepository;
    private final RelocationProfileRepository profileRepository;
    private final RelocationCityDatasetRepository cityDatasetRepository;
    private final ScoringCalculationHelper scoringHelper;
    private final RelocationMapper mapper;
    private final AnalyticsService analyticsService;
    private final UserRepository userRepository;
    private final SubscriptionService subscriptionService;
    private final RelocationProfileResolver profileResolver;
    private final BudgetSimulationRepository budgetSimulationRepository;

    public StarterKitService(StarterKitReportRepository reportRepository,
                              RelocationProfileRepository profileRepository,
                              RelocationCityDatasetRepository cityDatasetRepository,
                              ScoringCalculationHelper scoringHelper,
                              RelocationMapper mapper,
                              AnalyticsService analyticsService,
                              UserRepository userRepository,
                              SubscriptionService subscriptionService,
                              RelocationProfileResolver profileResolver,
                              BudgetSimulationRepository budgetSimulationRepository) {
        this.reportRepository = reportRepository;
        this.profileRepository = profileRepository;
        this.cityDatasetRepository = cityDatasetRepository;
        this.scoringHelper = scoringHelper;
        this.mapper = mapper;
        this.analyticsService = analyticsService;
        this.userRepository = userRepository;
        this.subscriptionService = subscriptionService;
        this.profileResolver = profileResolver;
        this.budgetSimulationRepository = budgetSimulationRepository;
    }

    @Transactional
    @SuppressWarnings("unchecked")
    public StarterKitResponse generate(UUID userId, GenerateStarterKitRequest request) {
        User user = userRepository.getReferenceById(userId);
        RelocationProfile profile = profileResolver.findOrRecover(userId);

        RelocationCityDataset city = resolveCity(request != null ? request.cityId() : null, profile);
        String scenario = profile.getUserType();

        String userPlan = subscriptionService.getUserPlan(userId);
        boolean isPremium = "PREMIUM".equals(userPlan) || "SUPER_PRO".equals(userPlan);
        boolean isSuperPro = "SUPER_PRO".equals(userPlan);

        Map<String, BigDecimal> scores = getCityScores(city);
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("userPlan", userPlan);

        // === FREE sections (always included) ===

        // City Alignment Snapshot (2 strengths + 1 attention)
        payload.put("cityAlignmentSnapshot", buildCityAlignmentSnapshot(city, scores));

        // City Fit Cards — FREE: 3 cards (Work, Housing, Social), PREMIUM+: all 6
        payload.put("cityFitCards", buildCityFitCards(city, scores, isPremium));

        // Budget analysis — prefer data from latest simulation for consistency
        boolean isFamily = profile.getHousehold() != null &&
                (profile.getHousehold().contains("children") || profile.getHousehold().contains("family"));
        BigDecimal minBudget = scoringHelper.computeCityCost(city, isFamily);

        List<BudgetSimulation> userSims = budgetSimulationRepository.findByUser_IdOrderByCreatedAtDesc(userId);
        BudgetSimulation latestSim = userSims.isEmpty() ? null : userSims.get(0);
        if (latestSim != null && latestSim.getOutputPayload() != null) {
            payload.put("budgetAnalysis", buildBudgetFromSimulation(latestSim, profile));
            // Use simulation cost for safety buffer
            Object simCost = latestSim.getOutputPayload().get("estimatedMonthlyCost");
            if (simCost instanceof Number n) minBudget = BigDecimal.valueOf(n.doubleValue());
        } else {
            payload.put("budgetAnalysis", buildBudgetAnalysis(city, profile, minBudget, isFamily));
        }

        // Quick Actions
        payload.put("quickActions", buildQuickActions(scenario, profile.getPriorityProblem(), city));

        // Scam sentinel
        payload.put("scamSentinel", buildScamSentinel(city.getCountry(), city.getCityName()));

        // Initial Stress Level (4 factors, 0-8)
        payload.put("initialStressLevel", computeInitialStressLevel(profile));

        // Relocation Risk (3 factors, 0-6)
        payload.put("relocationRisk", computeRelocationRisk(profile, city));

        // Common Relocation Mistake (available for all plans)
        payload.put("commonRelocationMistake", buildCommonMistake(scores, city));

        // === SUPER_PRO sections ===
        if (isSuperPro) {
            payload.put("sevenDayActionPlan", buildSevenDayActionPlan(city));
            payload.put("safetyBuffer", buildSafetyBuffer(minBudget));
        }

        // Create report with actions
        StarterKitReport report = new StarterKitReport();
        report.setUser(user);
        report.setCity(city);
        report.setScenario(scenario);
        report.setPayload(payload);

        List<Map<String, Object>> quickActions = (List<Map<String, Object>>) payload.get("quickActions");
        List<StarterKitAction> actions = new ArrayList<>();
        for (int i = 0; i < quickActions.size(); i++) {
            Map<String, Object> qa = quickActions.get(i);
            StarterKitAction action = new StarterKitAction();
            action.setReport(report);
            action.setActionOrder(i + 1);
            action.setTitle((String) qa.get("title"));
            action.setDescription((String) qa.get("description"));
            action.setCategory((String) qa.get("category"));
            actions.add(action);
        }
        report.setActions(actions);

        report = reportRepository.save(report);
        analyticsService.trackServerEventSafe(userId, "STARTER_KIT_GENERATED",
                Map.of("scenario", scenario, "reportId", report.getId().toString()));
        return mapper.toStarterKitResponse(report);
    }

    @Transactional(readOnly = true)
    public StarterKitResponse getLatest(UUID userId) {
        StarterKitReport report = reportRepository.findFirstByUser_IdOrderByCreatedAtDesc(userId)
                .orElseThrow(() -> new NotFoundException("Nessun Starter Kit generato"));
        return mapper.toStarterKitResponse(report);
    }

    // ========== CITY ALIGNMENT SNAPSHOT ==========

    private Map<String, Object> buildCityAlignmentSnapshot(RelocationCityDataset city,
                                                              Map<String, BigDecimal> scores) {
        List<Map.Entry<String, BigDecimal>> sorted = scores.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .toList();

        String highest = sorted.get(0).getKey();
        String secondHighest = sorted.get(1).getKey();
        String lowest = sorted.get(sorted.size() - 1).getKey();

        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("cityName", city.getCityName());
        snapshot.put("summary", "Based on your priorities, " + city.getCityName() +
                " appears broadly compatible with your lifestyle and professional goals.");
        snapshot.put("strengths", List.of(
                buildAlignmentPoint(highest, scores.get(highest), city.getCityName()),
                buildAlignmentPoint(secondHighest, scores.get(secondHighest), city.getCityName())
        ));
        snapshot.put("attention", buildAttentionPoint(lowest, scores.get(lowest), city.getCityName()));
        return snapshot;
    }

    private Map<String, Object> buildAlignmentPoint(String indicator, BigDecimal score, String cityName) {
        Map<String, Object> point = new LinkedHashMap<>();
        point.put("indicator", indicator);
        point.put("score", score);
        point.put("message", getStrengthMessage(indicator, cityName));
        return point;
    }

    private Map<String, Object> buildAttentionPoint(String indicator, BigDecimal score, String cityName) {
        Map<String, Object> point = new LinkedHashMap<>();
        point.put("indicator", indicator);
        point.put("score", score);
        point.put("message", getAttentionMessage(indicator, cityName));
        return point;
    }

    // ========== CITY FIT CARDS ==========

    private static final List<String> FREE_CARDS = List.of("work_opportunities", "housing_market", "social_integration");

    private List<Map<String, Object>> buildCityFitCards(RelocationCityDataset city,
                                                          Map<String, BigDecimal> scores,
                                                          boolean includeAll) {
        List<Map<String, Object>> cards = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : scores.entrySet()) {
            if (includeAll || FREE_CARDS.contains(entry.getKey())) {
                cards.add(buildFitCard(entry.getKey(), entry.getValue(), city.getCityName()));
            }
        }
        return cards;
    }

    private Map<String, Object> buildFitCard(String indicator, BigDecimal score, String cityName) {
        Map<String, Object> card = new LinkedHashMap<>();
        card.put("indicator", indicator);
        card.put("score", score);

        int s = score.intValue();
        String level;
        String message;
        if (s >= 80) {
            level = "STRONG";
            message = getFitMessage(indicator, "strong", cityName);
        } else if (s >= 60) {
            level = "GOOD";
            message = getFitMessage(indicator, "good", cityName);
        } else if (s >= 40) {
            level = "MODERATE";
            message = getFitMessage(indicator, "moderate", cityName);
        } else {
            level = "WEAK";
            message = getFitMessage(indicator, "weak", cityName);
        }

        card.put("level", level);
        card.put("message", message);
        card.put("cta", getCta(indicator));
        return card;
    }

    // ========== BUDGET ANALYSIS ==========

    @SuppressWarnings("unchecked")
    private Map<String, Object> buildBudgetFromSimulation(BudgetSimulation sim, RelocationProfile profile) {
        Map<String, Object> out = sim.getOutputPayload();
        Map<String, Object> budget = new LinkedHashMap<>();

        BigDecimal monthlyCost = out.get("estimatedMonthlyCost") instanceof Number n
                ? BigDecimal.valueOf(n.doubleValue()) : BigDecimal.ZERO;
        BigDecimal rent = out.get("rent") instanceof Number n
                ? BigDecimal.valueOf(n.doubleValue()) : BigDecimal.ZERO;
        BigDecimal livingCost = out.get("livingCost") instanceof Number n
                ? BigDecimal.valueOf(n.doubleValue()) : BigDecimal.ZERO;

        budget.put("minimumRealisticBudget", monthlyCost);
        budget.put("rent", rent);
        budget.put("livingExpenses", livingCost);
        budget.put("isFamily", "family".equals(out.get("livingType")));

        BigDecimal userBudget = profile.getMonthlyBudget();
        BigDecimal margin = userBudget.subtract(monthlyCost);
        budget.put("userBudget", userBudget);
        budget.put("margin", margin);

        String status;
        if (margin.compareTo(new BigDecimal("400")) >= 0) status = "sustainable";
        else if (margin.compareTo(new BigDecimal("100")) >= 0) status = "tight";
        else if (margin.compareTo(BigDecimal.ZERO) >= 0) status = "very_tight";
        else status = "unsustainable";
        budget.put("marginStatus", status);
        budget.put("source", "latest_simulation");
        return budget;
    }

    private Map<String, Object> buildBudgetAnalysis(RelocationCityDataset city, RelocationProfile profile,
                                                       BigDecimal minBudget, boolean isFamily) {
        Map<String, Object> budget = new LinkedHashMap<>();
        budget.put("minimumRealisticBudget", minBudget);
        budget.put("isFamily", isFamily);
        budget.put("rent", isFamily ? city.getApartment3brCenter() : city.getApartment1brCenter());
        budget.put("livingExpenses", isFamily ? city.getCostFamilyNoRent() : city.getCostSingleNoRent());

        BigDecimal userBudget = profile.getMonthlyBudget();
        BigDecimal margin = userBudget.subtract(minBudget);
        budget.put("userBudget", userBudget);
        budget.put("margin", margin);

        String status;
        if (margin.compareTo(new BigDecimal("400")) >= 0) status = "sustainable";
        else if (margin.compareTo(new BigDecimal("100")) >= 0) status = "tight";
        else if (margin.compareTo(BigDecimal.ZERO) >= 0) status = "very_tight";
        else status = "unsustainable";
        budget.put("marginStatus", status);
        return budget;
    }

    // ========== INITIAL STRESS LEVEL (4 factors, 0-8) ==========

    private Map<String, Object> computeInitialStressLevel(RelocationProfile profile) {
        int score = 0;

        // Factor 1: Timing (from userType)
        String userType = profile.getUserType() != null ? profile.getUserType() : "";
        switch (userType) {
            case "planning_move" -> score += 2;
            case "chosen_city" -> score += 1;
            // already_in_city / exploring → 0
        }

        // Factor 2: Household
        String household = profile.getHousehold() != null ? profile.getHousehold() : "";
        if (household.contains("children") || household.contains("family")) score += 2;
        else if (household.contains("partner") || household.contains("couple")) score += 1;

        // Factor 3: Main goal
        String goal = profile.getPrimaryGoal() != null ? profile.getPrimaryGoal() : "";
        switch (goal) {
            case "family_stability" -> score += 2;
            case "career_growth", "career", "study" -> score += 1;
            // remote_work, lifestyle → 0
        }

        // Factor 4: Primary need
        String need = profile.getPriorityProblem() != null ? profile.getPriorityProblem() : "";
        switch (need) {
            case "housing", "neighborhood" -> score += 2;
            case "cost_of_living", "bureaucracy", "legal_issues" -> score += 1;
            // social, friendships → 0
        }

        String level;
        if (score <= 2) level = "LOW";
        else if (score <= 5) level = "MEDIUM";
        else level = "HIGH";

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("score", score);
        result.put("level", level);
        result.put("maxScore", 8);
        return result;
    }

    // ========== RELOCATION RISK (3 factors, 0-6) ==========

    private Map<String, Object> computeRelocationRisk(RelocationProfile profile, RelocationCityDataset city) {
        int score = 0;

        // Factor 1: Budget vs market
        BigDecimal budget = profile.getMonthlyBudget();
        BigDecimal avgRent = city.getApartment1brCenter();
        if (budget.compareTo(avgRent) >= 0) score += 0;
        else if (budget.subtract(avgRent).abs().compareTo(avgRent.multiply(new BigDecimal("0.2"))) <= 0) score += 1;
        else score += 2;

        // Factor 2: Timing
        String userType = profile.getUserType() != null ? profile.getUserType() : "";
        switch (userType) {
            case "planning_move" -> score += 1;
            case "chosen_city" -> score += 2;
            // already_in_city → 0
        }

        // Factor 3: Housing request
        String household = profile.getHousehold() != null ? profile.getHousehold() : "";
        if (household.contains("children") || household.contains("family")) score += 2;
        else score += 1;

        String level;
        if (score <= 2) level = "LOW";
        else if (score <= 4) level = "MEDIUM";
        else level = "HIGH";

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("score", score);
        result.put("level", level);
        result.put("maxScore", 6);
        return result;
    }

    // ========== COMMON RELOCATION MISTAKE (based on lowest score) ==========

    private Map<String, Object> buildCommonMistake(Map<String, BigDecimal> scores, RelocationCityDataset city) {
        String lowestKey = scores.entrySet().stream()
                .min(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("housing_market");

        Map<String, Object> mistake = new LinkedHashMap<>();
        mistake.put("basedOn", lowestKey);
        mistake.put("score", scores.get(lowestKey));
        mistake.put("cityName", city.getCityName());

        switch (lowestKey) {
            case "housing_market" -> {
                mistake.put("title", "Underestimating the housing market");
                mistake.put("description", "Many people relocating to {city} underestimate how competitive the housing market can be. Start your search early and consider temporary housing first.");
            }
            case "cost_of_living" -> {
                mistake.put("title", "Not budgeting for real costs");
                mistake.put("description", "The actual cost of living in {city} often exceeds initial estimates. Use the Budget Simulator to get precise numbers before committing.");
            }
            case "social_integration" -> {
                mistake.put("title", "Neglecting social connections");
                mistake.put("description", "Social isolation is one of the top reasons relocations fail. In {city}, building connections early is essential for long-term wellbeing.");
            }
            case "work_opportunities" -> {
                mistake.put("title", "Assuming job market accessibility");
                mistake.put("description", "The professional landscape in {city} may require adaptation. Network actively and consider local certifications or language skills.");
            }
            case "quality_of_life" -> {
                mistake.put("title", "Overlooking daily quality factors");
                mistake.put("description", "Quality of life in {city} depends on neighborhood choice, healthcare access, and climate adaptation. Research neighborhoods thoroughly.");
            }
            default -> {
                mistake.put("title", "Rushing the relocation process");
                mistake.put("description", "Taking time to research and plan significantly improves relocation outcomes in {city}.");
            }
        }
        return mistake;
    }

    // ========== 7-DAY ACTION PLAN (SUPER_PRO) ==========

    private List<Map<String, Object>> buildSevenDayActionPlan(RelocationCityDataset city) {
        List<Map<String, Object>> plan = new ArrayList<>();

        Map<String, Object> days12 = new LinkedHashMap<>();
        days12.put("days", "1-2");
        days12.put("actions", List.of(
                actionMap("Run Budget Simulation", "Get a precise estimate of your monthly costs in {city}", "finance"),
                actionMap("Review relocation priorities", "Check your roadmap and adjust based on your budget results", "planning")
        ));
        plan.add(days12);

        Map<String, Object> days35 = new LinkedHashMap<>();
        days35.put("days", "3-5");
        days35.put("actions", List.of(
                actionMap("Ask a verified expert", "Connect with a relocation professional for {city}", "professionals"),
                actionMap("Connect with expats", "Join the expat community and ask real questions", "social"),
                actionMap("Explore events", "Find local events to attend after arrival", "events")
        ));
        plan.add(days35);

        Map<String, Object> days57 = new LinkedHashMap<>();
        days57.put("days", "5-7");
        days57.put("actions", List.of(
                actionMap("Start building connections", "Use matching to find compatible people in {city}", "social"),
                actionMap("Refine relocation strategy", "Update your roadmap with everything learned this week", "planning"),
                actionMap("Book expert consultation", "Schedule a call with a verified professional", "professionals")
        ));
        plan.add(days57);

        return plan;
    }

    // ========== SAFETY BUFFER (SUPER_PRO) ==========

    private Map<String, Object> buildSafetyBuffer(BigDecimal estimatedMonthlyCost) {
        Map<String, Object> buffer = new LinkedHashMap<>();
        buffer.put("title", "Minimum Financial Safety for Your Relocation");
        buffer.put("description", "Relocating without a financial reserve is one of the main reasons why relocations fail.");
        buffer.put("estimatedMonthlyCost", estimatedMonthlyCost);
        buffer.put("minimumReserve", estimatedMonthlyCost.multiply(new BigDecimal("3")).setScale(2, RoundingMode.HALF_UP));
        buffer.put("recommendedReserve", estimatedMonthlyCost.multiply(new BigDecimal("4")).setScale(2, RoundingMode.HALF_UP));
        buffer.put("coversItems", List.of(
                "Time needed to find housing",
                "Deposits and setup costs",
                "Unexpected expenses in the first months"
        ));
        return buffer;
    }

    // ========== QUICK ACTIONS (FREE) ==========

    private List<Map<String, Object>> buildQuickActions(String scenario, String priorityProblem,
                                                          RelocationCityDataset city) {
        List<Map<String, Object>> actions = new ArrayList<>();

        actions.add(actionMap("Change Your Answers",
                "Refine your profile to improve your relocation insights.", "profile"));
        actions.add(actionMap("Open Budget Simulator",
                "Estimate the real monthly cost of living in {city}.", "finance"));
        actions.add(actionMap("View Relocation Roadmap",
                "See the key steps to organize your move.", "planning"));
        actions.add(actionMap("Explore Verified Professionals",
                "Connect with housing agents, relocation experts and local advisors.", "professionals"));

        if ("loneliness".equals(priorityProblem) || "social_isolation".equals(priorityProblem)) {
            actions.add(actionMap("Join Expat Community",
                    "Connect with people who have already relocated to {city}.", "social"));
        }

        return actions;
    }

    // ========== SCAM SENTINEL ==========

    private Map<String, Object> buildScamSentinel(String country, String cityName) {
        Map<String, Object> sentinel = new LinkedHashMap<>();
        List<String> warnings = new ArrayList<>();
        warnings.add("Never pay deposits before viewing a property in person or via verified video call");
        warnings.add("Verify landlord identity through official property registry if possible");
        warnings.add("Be cautious of below-market-rate listings - if it's too good to be true, it likely is");

        String countryLower = country != null ? country.toLowerCase() : "";
        if (countryLower.contains("spain") || countryLower.contains("portugal")) {
            warnings.add("Watch for illegal tourist-rental-to-long-term conversions without proper contracts");
        }
        if (countryLower.contains("germany") || countryLower.contains("austria")) {
            warnings.add("Beware of Kaltmiete vs Warmmiete confusion - always clarify total monthly cost");
        }
        if (countryLower.contains("thailand") || countryLower.contains("indonesia") || countryLower.contains("vietnam")) {
            warnings.add("Use a reputable local agent for lease agreements - language barriers increase scam risk");
        }

        sentinel.put("warnings", warnings);
        sentinel.put("country", country);
        sentinel.put("city", cityName);
        return sentinel;
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
        throw new NotFoundException("Nessuna citta specificata");
    }

    private Map<String, BigDecimal> getCityScores(RelocationCityDataset city) {
        Map<String, BigDecimal> scores = new LinkedHashMap<>();
        scores.put("work_opportunities", scoringHelper.getCityMacroareeMap(city)
                .getOrDefault("opportunita_lavorative", BigDecimal.ZERO));
        scores.put("social_integration", scoringHelper.getCityMacroareeMap(city)
                .getOrDefault("integrazione_sociale", BigDecimal.ZERO));
        scores.put("quality_of_life", scoringHelper.getCityMacroareeMap(city)
                .getOrDefault("qualita_vita", BigDecimal.ZERO));
        scores.put("economic_power", scoringHelper.getCityMacroareeMap(city)
                .getOrDefault("potere_economico", BigDecimal.ZERO));
        scores.put("cost_of_living", scoringHelper.getCityMacroareeMap(city)
                .getOrDefault("costo_vita", BigDecimal.ZERO));
        scores.put("housing_market", scoringHelper.getCityMacroareeMap(city)
                .getOrDefault("mercato_immobiliare", BigDecimal.ZERO));
        return scores;
    }

    private Map<String, Object> actionMap(String title, String description, String category) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("title", title);
        map.put("description", description);
        map.put("category", category);
        return map;
    }

    private String getStrengthMessage(String indicator, String cityName) {
        return switch (indicator) {
            case "work_opportunities" -> "Work opportunities appear particularly strong, suggesting good potential for professional growth, remote work or international careers.";
            case "social_integration" -> "Social integration appears particularly strong in " + cityName + ", facilitating connections with locals and expat communities.";
            case "quality_of_life" -> "Quality of life is a clear strength in " + cityName + ", with favorable conditions for daily living.";
            case "economic_power" -> "Local economic power is strong, supporting purchasing capacity and financial stability.";
            case "cost_of_living" -> "Cost of living conditions are favorable, making daily expenses manageable.";
            case "housing_market" -> "The housing market shows good accessibility for newcomers.";
            default -> indicator + " appears strong in " + cityName + ".";
        };
    }

    private String getAttentionMessage(String indicator, String cityName) {
        return switch (indicator) {
            case "work_opportunities" -> "Work opportunities may require more planning and networking to access effectively.";
            case "social_integration" -> "Social integration may require more initiative, as building connections can take time.";
            case "quality_of_life" -> "Some quality of life factors may require adaptation and careful neighborhood choice.";
            case "economic_power" -> "Local economic conditions may impact purchasing power — plan your budget accordingly.";
            case "cost_of_living" -> "The cost of living may require budget adjustments compared to your current location.";
            case "housing_market" -> "The housing market may require more planning, as availability and pricing can make finding accommodation more challenging.";
            default -> indicator + " may require attention in " + cityName + ".";
        };
    }

    private String getFitMessage(String indicator, String level, String cityName) {
        String base = switch (indicator) {
            case "work_opportunities" -> switch (level) {
                case "strong" -> "Your professional situation appears highly compatible with " + cityName + ".";
                case "good" -> "Your situation appears generally compatible with " + cityName + ".";
                case "moderate" -> "This aspect of life in " + cityName + " may require some planning and flexibility.";
                default -> "This aspect may be more challenging in " + cityName + ".";
            };
            case "housing_market" -> switch (level) {
                case "strong" -> "Housing affordability appears very favorable in " + cityName + ".";
                case "good" -> "Housing affordability appears generally manageable.";
                case "moderate" -> "Housing affordability may require planning.";
                default -> "Housing affordability may be more challenging.";
            };
            case "social_integration" -> switch (level) {
                case "strong" -> "Social integration appears particularly strong in " + cityName + ".";
                case "good" -> "Social integration appears generally positive.";
                case "moderate" -> "Social integration may require initiative.";
                default -> "Social integration may be slower for newcomers.";
            };
            case "quality_of_life" -> switch (level) {
                case "strong" -> "Quality of life is excellent in " + cityName + ".";
                case "good" -> "Quality of life is generally good.";
                case "moderate" -> "Quality of life varies by neighborhood.";
                default -> "Quality of life may require careful neighborhood selection.";
            };
            case "economic_power" -> switch (level) {
                case "strong" -> "Local economic power is very favorable.";
                case "good" -> "Economic conditions are generally supportive.";
                case "moderate" -> "Economic conditions are moderate — budget planning recommended.";
                default -> "Economic conditions may impact purchasing power.";
            };
            case "cost_of_living" -> switch (level) {
                case "strong" -> "Daily cost of living is very affordable.";
                case "good" -> "Daily costs are generally manageable.";
                case "moderate" -> "Daily costs require moderate budget discipline.";
                default -> "Daily costs may strain your budget.";
            };
            default -> cityName + " scores " + level + " on " + indicator + ".";
        };
        return base;
    }

    private String getCta(String indicator) {
        return switch (indicator) {
            case "work_opportunities" -> "Career Advisor / Job Market Consultant";
            case "housing_market" -> "Local Real Estate Agent";
            case "social_integration" -> "Syncro Lounge / Community";
            case "quality_of_life" -> "Neighborhood Guide";
            case "economic_power" -> "Financial Advisor";
            case "cost_of_living" -> "Open Budget Simulator";
            default -> "Talk to a relocation expert";
        };
    }
}
