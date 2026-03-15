package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.relocation.dto.GenerateStarterKitRequest;
import com.syncro.backend.domain.relocation.dto.StarterKitResponse;
import com.syncro.backend.domain.relocation.entity.*;
import com.syncro.backend.domain.relocation.mapper.RelocationMapper;
import com.syncro.backend.domain.relocation.repository.*;
import com.syncro.backend.domain.analytics.service.AnalyticsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
public class StarterKitService {

    private final StarterKitReportRepository reportRepository;
    private final RelocationProfileRepository profileRepository;
    private final RelocationCityDatasetRepository cityDatasetRepository;
    private final RelocationScoringConfigRepository scoringConfigRepository;
    private final RelocationRiskSnapshotRepository riskSnapshotRepository;
    private final ScoringCalculationHelper scoringHelper;
    private final RelocationMapper mapper;
    private final AnalyticsService analyticsService;

    public StarterKitService(StarterKitReportRepository reportRepository,
                              RelocationProfileRepository profileRepository,
                              RelocationCityDatasetRepository cityDatasetRepository,
                              RelocationScoringConfigRepository scoringConfigRepository,
                              RelocationRiskSnapshotRepository riskSnapshotRepository,
                              ScoringCalculationHelper scoringHelper,
                              RelocationMapper mapper,
                              AnalyticsService analyticsService) {
        this.reportRepository = reportRepository;
        this.profileRepository = profileRepository;
        this.cityDatasetRepository = cityDatasetRepository;
        this.scoringConfigRepository = scoringConfigRepository;
        this.riskSnapshotRepository = riskSnapshotRepository;
        this.scoringHelper = scoringHelper;
        this.mapper = mapper;
        this.analyticsService = analyticsService;
    }

    @Transactional
    public StarterKitResponse generate(User user, GenerateStarterKitRequest request) {
        RelocationProfile profile = profileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new NotFoundException("Profilo relocation non trovato"));

        RelocationCityDataset city = resolveCity(request != null ? request.cityId() : null, profile);
        RelocationScoringConfig config = scoringConfigRepository.findByConfigKeyAndActiveTrue("city_scoring_v1")
                .orElseThrow(() -> new NotFoundException("Configurazione scoring non trovata"));

        String scenario = profile.getUserType();
        Map<String, Object> payload = new LinkedHashMap<>();

        // Section 1: City analysis
        payload.put("cityAnalysis", buildCityAnalysis(city));

        // Section 2: Minimum realistic budget
        boolean isFamily = profile.getHousehold() != null &&
                (profile.getHousehold().contains("children") || profile.getHousehold().contains("family"));
        BigDecimal minBudget = scoringHelper.computeCityCost(city, isFamily);
        Map<String, Object> budgetSection = new LinkedHashMap<>();
        budgetSection.put("minimumRealisticBudget", minBudget);
        budgetSection.put("isFamily", isFamily);
        budgetSection.put("rent", isFamily ? city.getApartment3brCenter() : city.getApartment1brCenter());
        budgetSection.put("livingExpenses", isFamily ? city.getCostFamilyNoRent() : city.getCostSingleNoRent());
        BigDecimal userBudget = profile.getMonthlyBudget();
        BigDecimal margin = userBudget.subtract(minBudget);
        budgetSection.put("userBudget", userBudget);
        budgetSection.put("margin", margin);
        budgetSection.put("marginStatus", scoringHelper.classifyMarginStatus(margin, config));
        payload.put("budgetAnalysis", budgetSection);

        // Section 3: 3 actions in 7 days
        payload.put("quickActions", buildQuickActions(scenario, profile.getPriorityProblem(), city));

        // Section 4: Typical relocation mistake
        payload.put("typicalMistake", buildTypicalMistake(scenario));

        // Section 5: Scam sentinel
        payload.put("scamSentinel", buildScamSentinel(city.getCountry(), city.getCityName()));

        // Section 6: Burnout risk index
        int burnoutIndex = computeBurnoutIndex(profile, margin, config);
        Map<String, Object> burnoutSection = new LinkedHashMap<>();
        burnoutSection.put("burnoutIndex", burnoutIndex);
        burnoutSection.put("level", classifyBurnoutLevel(burnoutIndex));
        payload.put("burnoutRisk", burnoutSection);

        // Section 7: Risk snapshot
        Map<String, Object> riskSection = buildRiskSnapshot(profile, burnoutIndex, margin, config);
        payload.put("riskSnapshot", riskSection);

        // Create report
        StarterKitReport report = new StarterKitReport();
        report.setUser(user);
        report.setCity(city);
        report.setScenario(scenario);
        report.setPayload(payload);

        // Create actions
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
        analyticsService.trackServerEventSafe(user.getId(), "STARTER_KIT_GENERATED",
                Map.of("scenario", scenario, "reportId", report.getId().toString()));
        return mapper.toStarterKitResponse(report);
    }

    @Transactional(readOnly = true)
    public StarterKitResponse getLatest(User user) {
        StarterKitReport report = reportRepository.findFirstByUser_IdOrderByCreatedAtDesc(user.getId())
                .orElseThrow(() -> new NotFoundException("Nessun Starter Kit generato"));
        return mapper.toStarterKitResponse(report);
    }

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

    private Map<String, Object> buildCityAnalysis(RelocationCityDataset city) {
        Map<String, Object> analysis = new LinkedHashMap<>();
        analysis.put("cityName", city.getCityName());
        analysis.put("country", city.getCountry());
        analysis.put("macroaree", Map.of(
                "costoVita", city.getMacroCostoVita(),
                "mercatoImmobiliare", city.getMacroMercatoImmobiliare(),
                "potereEconomico", city.getMacroPotereEconomico(),
                "qualitaVita", city.getMacroQualitaVita(),
                "opportunitaLavorative", city.getMacroOpportunitaLavorative(),
                "integrazioneSociale", city.getMacroIntegrazioneSociale()
        ));
        analysis.put("safetyIndex", city.getSafetyIndex());
        analysis.put("healthcareIndex", city.getHealthcareIndex());
        return analysis;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> buildQuickActions(String scenario, String priorityProblem,
                                                          RelocationCityDataset city) {
        List<Map<String, Object>> actions = new ArrayList<>();

        switch (scenario != null ? scenario : "") {
            case "planning_move" -> {
                actions.add(actionMap("Research housing market in " + city.getCityName(),
                        "Check apartment listings on local portals. Target areas with rent index < 70 for better affordability.",
                        "housing"));
                actions.add(actionMap("Calculate precise monthly budget",
                        "Use the Budget Simulation tool with your income data to get a stress index for " + city.getCityName() + ".",
                        "finance"));
                actions.add(actionMap("Join expat communities online",
                        "Find Facebook groups, Reddit communities, and local meetup events for " + city.getCityName() + " expats.",
                        "social"));
            }
            case "chosen_city" -> {
                actions.add(actionMap("Secure temporary accommodation",
                        "Book at least 30 days of temporary housing. Avoid long-term contracts before seeing the neighborhood in person.",
                        "housing"));
                actions.add(actionMap("Open a local bank account",
                        "Research requirements for opening a bank account in " + city.getCountry() + " as a foreigner.",
                        "finance"));
                actions.add(actionMap("Register with local authorities",
                        "Check registration requirements within first 2 weeks of arrival in " + city.getCountry() + ".",
                        "admin"));
            }
            default -> {
                actions.add(actionMap("Assess your current integration level",
                        "Complete the available micro-tests to identify areas that need attention.",
                        "assessment"));
                actions.add(actionMap("Review your budget vs actual spending",
                        "Use Budget Tracking to compare your planned vs actual expenses this month.",
                        "finance"));
                actions.add(actionMap("Expand your local network",
                        "Attend at least one local event or meetup this week to strengthen social connections.",
                        "social"));
            }
        }

        if ("loneliness".equals(priorityProblem) || "social_isolation".equals(priorityProblem)) {
            actions.add(actionMap("Priority: Address social isolation",
                    "Sign up for a coworking space or language exchange in " + city.getCityName() + ".",
                    "priority"));
        }

        return actions;
    }

    private Map<String, Object> actionMap(String title, String description, String category) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("title", title);
        map.put("description", description);
        map.put("category", category);
        return map;
    }

    private Map<String, Object> buildTypicalMistake(String scenario) {
        Map<String, Object> mistake = new LinkedHashMap<>();
        switch (scenario != null ? scenario : "") {
            case "planning_move" -> {
                mistake.put("title", "Signing a long-term lease remotely");
                mistake.put("description", "Many expats sign 12-month contracts before seeing the apartment or neighborhood. Always visit in person or use a temporary rental for the first 1-2 months.");
                mistake.put("severity", "HIGH");
            }
            case "chosen_city" -> {
                mistake.put("title", "Underestimating bureaucratic timelines");
                mistake.put("description", "Visa renewals, residence permits, and local registrations often take 2-3x longer than expected. Start all paperwork immediately upon arrival.");
                mistake.put("severity", "HIGH");
            }
            default -> {
                mistake.put("title", "Neglecting social integration");
                mistake.put("description", "After the initial excitement fades, many expats retreat into work-only mode. Actively maintaining social connections is crucial for long-term wellbeing.");
                mistake.put("severity", "MEDIUM");
            }
        }
        return mistake;
    }

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

    private int computeBurnoutIndex(RelocationProfile profile, BigDecimal margin,
                                      RelocationScoringConfig config) {
        int index = 0;

        String marginStatus = scoringHelper.classifyMarginStatus(margin, config);
        switch (marginStatus) {
            case "unsustainable" -> index += 35;
            case "very_tight" -> index += 25;
            case "tight" -> index += 15;
            case "sustainable" -> index += 5;
        }

        if ("alone".equals(profile.getHousehold()) || "single".equals(profile.getHousehold())) {
            index += 15;
        }

        String priority = profile.getPriorityProblem();
        if ("loneliness".equals(priority) || "social_isolation".equals(priority)) {
            index += 20;
        } else if ("bureaucracy".equals(priority) || "legal_issues".equals(priority)) {
            index += 10;
        }

        if ("already_in_city".equals(profile.getUserType())) {
            index += 5;
        } else if ("planning_move".equals(profile.getUserType())) {
            index += 10;
        }

        return Math.min(100, index);
    }

    private String classifyBurnoutLevel(int index) {
        if (index >= 70) return "CRITICAL";
        if (index >= 50) return "HIGH";
        if (index >= 30) return "MODERATE";
        return "LOW";
    }

    private Map<String, Object> buildRiskSnapshot(RelocationProfile profile, int burnoutIndex,
                                                     BigDecimal margin, RelocationScoringConfig config) {
        Map<String, Object> risk = new LinkedHashMap<>();
        Map<String, Object> indicators = new LinkedHashMap<>();

        String marginStatus = scoringHelper.classifyMarginStatus(margin, config);
        indicators.put("financialRisk", marginStatus.equals("unsustainable") || marginStatus.equals("very_tight") ? "HIGH" : "LOW");
        indicators.put("burnoutRisk", classifyBurnoutLevel(burnoutIndex));
        indicators.put("isolationRisk", "alone".equals(profile.getHousehold()) ? "MODERATE" : "LOW");

        risk.put("indicators", indicators);
        risk.put("burnoutIndex", burnoutIndex);

        long highCount = indicators.values().stream()
                .filter(v -> "HIGH".equals(v) || "CRITICAL".equals(v))
                .count();
        String overallLevel;
        if (highCount >= 2) overallLevel = "HIGH";
        else if (highCount == 1) overallLevel = "MODERATE";
        else overallLevel = "LOW";
        risk.put("overallRiskLevel", overallLevel);

        return risk;
    }
}
