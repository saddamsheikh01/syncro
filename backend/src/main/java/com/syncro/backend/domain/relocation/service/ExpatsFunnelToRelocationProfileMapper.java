package com.syncro.backend.domain.relocation.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.syncro.backend.domain.expats.entity.ExpatsAnonymousAnswer;
import com.syncro.backend.domain.relocation.entity.RelocationCityDataset;
import com.syncro.backend.domain.relocation.entity.RelocationProfile;
import com.syncro.backend.domain.relocation.repository.RelocationCityDatasetRepository;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Maps expats funnel answers (question_key + JSON answer_value) onto {@link RelocationProfile}
 * and builds scoring payload extras (relocationTime, ageRange, …) for anonymous WOW flow.
 */
@Component
public class ExpatsFunnelToRelocationProfileMapper {

    private final RelocationCityDatasetRepository cityDatasetRepository;

    public ExpatsFunnelToRelocationProfileMapper(RelocationCityDatasetRepository cityDatasetRepository) {
        this.cityDatasetRepository = cityDatasetRepository;
    }

    public void applyAnswers(RelocationProfile profile, List<ExpatsAnonymousAnswer> answers) {
        applyDefaults(profile);
        for (ExpatsAnonymousAnswer a : answers) {
            JsonNode v = a.getAnswerValue();
            if (v == null || v.isNull()) {
                continue;
            }
            switch (a.getQuestionKey()) {
                case "user_phase" -> mapUserPhase(profile, v);
                case "city_selection" -> mapCitySelection(profile, v);
                case "relocation_time", "time_living_there" -> { /* in extras */ }
                case "age_range" -> mapAgeRange(profile, v);
                case "relationship" -> mapRelationship(profile, v);
                case "motivation" -> {
                    if (v.isTextual()) {
                        profile.setPrimaryGoal(v.asText());
                    }
                }
                case "work_type" -> mapWorkType(profile, v);
                case "budget" -> mapBudget(profile, v);
                case "need" -> {
                    if (v.isTextual()) {
                        profile.setPriorityProblem(mapPriorityProblem(v.asText()));
                    }
                }
                case "city_priority" -> {
                    if (v.isTextual()) {
                        profile.setSocialPriority(v.asText());
                    }
                }
                default -> { }
            }
        }
        resolveCities(profile);
        int filled = countFilledSteps(profile);
        profile.setCompletedSteps(Math.min(10, filled));
        profile.setCompletionPercent(Math.min(100, filled * 10));
        if (filled >= 8) {
            profile.setStatus("COMPLETED");
        } else {
            profile.setStatus("IN_PROGRESS");
        }
    }

    /**
     * Fields consumed by {@link ScoringCalculationHelper#mapPayloadToWeightKeys} that are not on the profile entity.
     */
    public Map<String, Object> funnelExtrasForPayload(List<ExpatsAnonymousAnswer> answers) {
        Map<String, Object> m = new LinkedHashMap<>();
        for (ExpatsAnonymousAnswer a : answers) {
            JsonNode v = a.getAnswerValue();
            if (v == null || v.isNull()) {
                continue;
            }
            switch (a.getQuestionKey()) {
                case "relocation_time", "time_living_there" -> {
                    if (v.isTextual()) {
                        m.put("relocationTime", v.asText());
                    }
                }
                case "age_range" -> {
                    if (v.isObject() && v.has("ageRange")) {
                        m.put("ageRange", v.get("ageRange").asText());
                    } else if (v.isTextual()) {
                        m.put("ageRange", v.asText());
                    }
                }
                default -> { }
            }
        }
        return m;
    }

    private static void applyDefaults(RelocationProfile p) {
        if (p.getHousehold() == null) {
            p.setHousehold("alone");
        }
        if (p.getMonthlyBudget() == null) {
            p.setMonthlyBudget(new BigDecimal("2000"));
        }
        if (p.getPrimaryGoal() == null) {
            p.setPrimaryGoal("lifestyle");
        }
        if (p.getSocialPriority() == null) {
            p.setSocialPriority("medium");
        }
        if (p.getDesiredLifestyle() == null) {
            p.setDesiredLifestyle("balanced");
        }
        if (p.getWorkStatus() == null) {
            p.setWorkStatus("employed");
        }
        if (p.getPriorityProblem() == null) {
            p.setPriorityProblem("cost_of_living");
        }
        if (p.getUserType() == null) {
            p.setUserType("planning_move");
        }
        if (p.getHasPets() == null) {
            p.setHasPets(false);
        }
        if (p.getIsRemote() == null) {
            p.setIsRemote(false);
        }
    }

    private static void mapUserPhase(RelocationProfile p, JsonNode v) {
        if (!v.isTextual()) {
            return;
        }
        switch (v.asText()) {
            case "recently_moved" -> p.setUserType("chosen_city");
            case "already_there" -> p.setUserType("already_in_city");
            default -> p.setUserType("planning_move");
        }
    }

    private void mapCitySelection(RelocationProfile p, JsonNode v) {
        if (!v.isObject()) {
            return;
        }
        if (v.has("targetCityId") && !v.get("targetCityId").isNull()) {
            resolveCityById(v.get("targetCityId").asText(), city -> {
                p.setTargetCity(city);
                p.setTargetCityName(city.getCityName());
            });
        }
        if (v.has("currentCityId") && !v.get("currentCityId").isNull()) {
            resolveCityById(v.get("currentCityId").asText(), city -> {
                p.setCurrentCity(city);
                p.setCurrentCityName(city.getCityName());
            });
        }
        if (v.has("targetCityName") && !v.get("targetCityName").isNull() && p.getTargetCity() == null) {
            p.setTargetCityName(v.get("targetCityName").asText());
        }
        if (v.has("currentCityName") && !v.get("currentCityName").isNull() && p.getCurrentCity() == null) {
            p.setCurrentCityName(v.get("currentCityName").asText());
        }
    }

    private static void mapAgeRange(RelocationProfile p, JsonNode v) {
        /* age only affects payload extras */
    }

    private static void mapRelationship(RelocationProfile p, JsonNode v) {
        if (!v.isObject()) {
            return;
        }
        if (v.has("household") && v.get("household").isTextual()) {
            String h = v.get("household").asText();
            p.setHousehold(switch (h) {
                case "with_partner" -> "with_partner";
                case "with_children" -> "with_children";
                default -> "alone";
            });
        }
        if (v.has("hasPets")) {
            p.setHasPets(v.get("hasPets").asBoolean(false));
        }
        if (v.has("childrenAgeRange") && v.get("childrenAgeRange").isTextual()) {
            p.setChildrenAgeRange(v.get("childrenAgeRange").asText());
        }
    }

    private static void mapWorkType(RelocationProfile p, JsonNode v) {
        if (!v.isObject()) {
            return;
        }
        if (v.has("workStatus") && v.get("workStatus").isTextual()) {
            p.setWorkStatus(v.get("workStatus").asText());
        }
        if (v.has("isRemote")) {
            p.setIsRemote(v.get("isRemote").asBoolean(false));
        }
    }

    private static void mapBudget(RelocationProfile p, JsonNode v) {
        if (!v.isObject()) {
            return;
        }
        if (v.has("monthlyBudget") && v.get("monthlyBudget").isNumber()) {
            p.setMonthlyBudget(BigDecimal.valueOf(v.get("monthlyBudget").asDouble()));
        }
        if (v.has("desiredLifestyle") && v.get("desiredLifestyle").isTextual()) {
            p.setDesiredLifestyle(v.get("desiredLifestyle").asText());
        }
    }

    private static String mapPriorityProblem(String frontend) {
        return switch (frontend) {
            case "housing" -> "housing";
            case "neighborhood" -> "neighborhood";
            case "cost_of_living" -> "cost_of_living";
            case "professional_network" -> "professional_network";
            case "friendships" -> "friendships";
            case "schools_family" -> "schools_family";
            case "bureaucracy" -> "bureaucracy";
            case "career_opportunities" -> "career_opportunities";
            default -> "cost_of_living";
        };
    }

    private void resolveCities(RelocationProfile p) {
        if (p.getTargetCityName() != null && !p.getTargetCityName().isBlank()) {
            String slug = p.getTargetCityName().toLowerCase().replaceAll("\\s+", "-");
            cityDatasetRepository.findByCitySlugAndActiveTrue(slug).ifPresent(p::setTargetCity);
        }
        if (p.getCurrentCityName() != null && !p.getCurrentCityName().isBlank()) {
            String slug = p.getCurrentCityName().toLowerCase().replaceAll("\\s+", "-");
            cityDatasetRepository.findByCitySlugAndActiveTrue(slug).ifPresent(p::setCurrentCity);
        }
    }

    private void resolveCityById(String rawId, java.util.function.Consumer<RelocationCityDataset> assign) {
        try {
            UUID cityId = UUID.fromString(rawId);
            cityDatasetRepository.findById(cityId).ifPresent(assign);
        } catch (IllegalArgumentException ignored) {
            // Keep the textual city fallback when the provided id is not a valid UUID.
        }
    }

    private static int countFilledSteps(RelocationProfile p) {
        int n = 0;
        if (p.getUserType() != null) {
            n++;
        }
        if (p.getTargetCityName() != null || p.getCurrentCityName() != null) {
            n++;
        }
        if (p.getMonthlyBudget() != null && p.getMonthlyBudget().signum() > 0) {
            n++;
        }
        if (p.getPrimaryGoal() != null) {
            n++;
        }
        if (p.getHousehold() != null) {
            n++;
        }
        if (p.getWorkStatus() != null) {
            n++;
        }
        if (p.getPriorityProblem() != null) {
            n++;
        }
        if (p.getDesiredLifestyle() != null) {
            n++;
        }
        return Math.max(n, 1);
    }
}
