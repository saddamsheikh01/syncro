package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.analytics.service.AnalyticsService;
import com.syncro.backend.domain.relocation.dto.*;
import com.syncro.backend.domain.relocation.entity.RelocationCityDataset;
import com.syncro.backend.domain.relocation.entity.RelocationOnboardingSnapshot;
import com.syncro.backend.domain.relocation.entity.RelocationProfile;
import com.syncro.backend.domain.relocation.mapper.RelocationMapper;
import com.syncro.backend.domain.relocation.repository.RelocationCityDatasetRepository;
import com.syncro.backend.domain.relocation.repository.RelocationCityScoreRepository;
import com.syncro.backend.domain.relocation.repository.RelocationOnboardingSnapshotRepository;
import com.syncro.backend.domain.relocation.repository.RelocationProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@Service
public class RelocationOnboardingService {

    private static final int TOTAL_STEPS = 10;

    private final RelocationProfileRepository profileRepository;
    private final RelocationOnboardingSnapshotRepository snapshotRepository;
    private final RelocationCityDatasetRepository cityDatasetRepository;
    private final RelocationCityScoreRepository cityScoreRepository;
    private final UserRepository userRepository;
    private final RelocationMapper mapper;
    private final AnalyticsService analyticsService;

    public RelocationOnboardingService(RelocationProfileRepository profileRepository,
                                       RelocationOnboardingSnapshotRepository snapshotRepository,
                                       RelocationCityDatasetRepository cityDatasetRepository,
                                       RelocationCityScoreRepository cityScoreRepository,
                                       UserRepository userRepository,
                                       RelocationMapper mapper,
                                       AnalyticsService analyticsService) {
        this.profileRepository = profileRepository;
        this.snapshotRepository = snapshotRepository;
        this.cityDatasetRepository = cityDatasetRepository;
        this.cityScoreRepository = cityScoreRepository;
        this.userRepository = userRepository;
        this.mapper = mapper;
        this.analyticsService = analyticsService;
    }

    @Transactional(readOnly = true)
    public OnboardingResponse getOnboarding(UUID userId) {
        RelocationProfile profile = findProfileOrThrow(userId);
        return mapper.toOnboardingResponse(profile);
    }

    @Transactional
    public OnboardingResponse updateOnboarding(UUID userId, UpdateOnboardingRequest request) {
        RelocationProfile profile = profileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    RelocationProfile p = new RelocationProfile();
                    p.setUser(userRepository.getReferenceById(userId));
                    p.setUserType("planning_move"); // default
                    p.setHousehold("single");
                    p.setMonthlyBudget(java.math.BigDecimal.ZERO);
                    p.setPrimaryGoal("quality_of_life");
                    p.setSocialPriority("medium");
                    p.setDesiredLifestyle("balanced");
                    p.setWorkStatus("employed");
                    p.setPriorityProblem("monthly_costs");
                    return p;
                });

        // Apply partial update fields
        if (request.userType() != null) profile.setUserType(request.userType());
        if (request.targetCityName() != null) profile.setTargetCityName(request.targetCityName());
        if (request.targetCountry() != null) profile.setTargetCountry(request.targetCountry());
        if (request.household() != null) profile.setHousehold(request.household());
        if (request.hasPets() != null) profile.setHasPets(request.hasPets());
        if (request.childrenAgeRange() != null) profile.setChildrenAgeRange(request.childrenAgeRange());
        if (request.monthlyBudget() != null) profile.setMonthlyBudget(request.monthlyBudget());
        if (request.primaryGoal() != null) profile.setPrimaryGoal(request.primaryGoal());
        if (request.socialPriority() != null) profile.setSocialPriority(request.socialPriority());
        if (request.desiredLifestyle() != null) profile.setDesiredLifestyle(request.desiredLifestyle());
        if (request.workStatus() != null) profile.setWorkStatus(request.workStatus());
        if (request.isRemote() != null) profile.setIsRemote(request.isRemote());
        if (request.priorityProblem() != null) profile.setPriorityProblem(request.priorityProblem());
        if (request.freeNotes() != null) profile.setFreeNotes(request.freeNotes());

        // Resolve target city FK, preferring the explicit catalog id when present.
        if (request.targetCityId() != null) {
            var targetCityOpt = cityDatasetRepository.findById(request.targetCityId());
            if (targetCityOpt.isPresent()) {
                RelocationCityDataset city = targetCityOpt.get();
                profile.setTargetCity(city);
                profile.setTargetCityName(city.getCityName());
            }
        } else if (request.targetCityName() != null) {
            resolveTargetCity(profile, request.targetCityName());
        }

        // Resolve current city FK
        if (request.currentCityId() != null) {
            var currentCityOpt = cityDatasetRepository.findById(request.currentCityId());
            if (currentCityOpt.isPresent()) {
                profile.setCurrentCity(currentCityOpt.get());
                profile.setCurrentCityName(currentCityOpt.get().getCityName());
            }
        }
        if (request.currentCityName() != null && request.currentCityId() == null) {
            profile.setCurrentCityName(request.currentCityName());
            resolveCurrentCity(profile, request.currentCityName());
        }

        // Update completed steps and completion percent
        if (request.completedSteps() != null) {
            profile.setCompletedSteps(request.completedSteps());
            int percent = Math.min(100, (request.completedSteps() * 100) / TOTAL_STEPS);
            profile.setCompletionPercent(percent);
        }

        // Check completion
        if (profile.getCompletedSteps() >= TOTAL_STEPS && !"COMPLETED".equals(profile.getStatus())) {
            profile.setStatus("COMPLETED");
            profile.setCompletionPercent(100);

            analyticsService.trackServerEventSafe(userId, "RELOCATION_ONBOARDING_COMPLETED",
                    Map.of("userType", profile.getUserType()));
        }

        profile = profileRepository.save(profile);
        return mapper.toOnboardingResponse(profile);
    }

    @Transactional(readOnly = true)
    public OnboardingStatusResponse getOnboardingStatus(UUID userId) {
        RelocationProfile profile = findProfileOrThrow(userId);

        Optional<RelocationOnboardingSnapshot> activeSnapshot =
                snapshotRepository.findByUserIdAndIsActiveTrue(userId);

        int maxVersion = snapshotRepository.findMaxVersionByUserId(userId);

        return mapper.toOnboardingStatusResponse(
                profile,
                activeSnapshot.isPresent(),
                maxVersion > 0 ? maxVersion : null
        );
    }

    /**
     * Creates a new immutable snapshot from the current profile state.
     * Deactivates any existing active snapshot.
     */
    @Transactional
    public SnapshotResponse createSnapshot(UUID userId) {
        RelocationProfile profile = findProfileOrThrow(userId);

        if (!"COMPLETED".equals(profile.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Onboarding must be completed before creating a snapshot");
        }

        // Deactivate current active snapshot
        snapshotRepository.findByUserIdAndIsActiveTrue(userId)
                .ifPresent(s -> {
                    s.setIsActive(false);
                    snapshotRepository.save(s);
                });

        // Build payload from profile fields
        Map<String, Object> payload = buildSnapshotPayload(profile);

        int nextVersion = snapshotRepository.findMaxVersionByUserId(userId) + 1;

        RelocationOnboardingSnapshot snapshot = new RelocationOnboardingSnapshot();
        snapshot.setUser(userRepository.getReferenceById(userId));
        snapshot.setRelocationProfile(profile);
        snapshot.setVersion(nextVersion);
        snapshot.setPayload(payload);
        snapshot.setIsActive(true);

        snapshot = snapshotRepository.save(snapshot);
        return mapper.toSnapshotResponse(snapshot);
    }

    @Transactional(readOnly = true)
    public List<SnapshotResponse> getSnapshots(UUID userId) {
        return snapshotRepository.findByUserIdOrderByVersionDesc(userId)
                .stream()
                .map(mapper::toSnapshotResponse)
                .toList();
    }

    /**
     * Stato attivazione post-registrazione: step completati, step mancanti, next actions.
     * Usato dalla activation page per guidare l'utente dopo la conversione anonimo → registrato.
     */
    @Transactional(readOnly = true)
    public ActivationStateResponse getActivationState(UUID userId) {
        RelocationProfile profile = findProfileOrThrow(userId);

        List<String> completedFields = new ArrayList<>();
        List<String> missingFields = new ArrayList<>();

        checkField(profile.getUserType(), "user_phase", completedFields, missingFields);
        checkField(profile.getTargetCityName(), "target_city", completedFields, missingFields);
        checkField(profile.getHousehold(), "household", completedFields, missingFields);
        checkBudgetField(profile.getMonthlyBudget(), completedFields, missingFields);
        checkField(profile.getPrimaryGoal(), "primary_goal", completedFields, missingFields);
        checkField(profile.getSocialPriority(), "social_priority", completedFields, missingFields);
        checkField(profile.getDesiredLifestyle(), "desired_lifestyle", completedFields, missingFields);
        checkField(profile.getWorkStatus(), "work_status", completedFields, missingFields);
        checkField(profile.getPriorityProblem(), "priority_problem", completedFields, missingFields);
        checkField(profile.getFreeNotes(), "free_notes", completedFields, missingFields);

        boolean hasActiveSnapshot = snapshotRepository.findByUserIdAndIsActiveTrue(userId).isPresent();
        boolean hasScoringResults = !cityScoreRepository.findByUserIdOrderByCreatedAtDesc(userId).isEmpty();

        // Costruisci next actions in base allo stato
        List<Map<String, String>> nextActions = buildNextActions(profile, missingFields, hasActiveSnapshot, hasScoringResults);

        return new ActivationStateResponse(
                profile.getStatus(),
                profile.getUserType(),
                profile.getCompletedSteps(),
                TOTAL_STEPS,
                profile.getCompletionPercent(),
                completedFields,
                missingFields,
                nextActions,
                hasActiveSnapshot,
                hasScoringResults,
                profile.getUpdatedAt()
        );
    }

    private void checkField(Object value, String fieldName, List<String> completed, List<String> missing) {
        if (value != null) {
            completed.add(fieldName);
        } else {
            missing.add(fieldName);
        }
    }

    private void checkBudgetField(java.math.BigDecimal budget, List<String> completed, List<String> missing) {
        if (budget != null && budget.compareTo(java.math.BigDecimal.ZERO) > 0) {
            completed.add("monthly_budget");
        } else {
            missing.add("monthly_budget");
        }
    }

    private List<Map<String, String>> buildNextActions(RelocationProfile profile,
                                                        List<String> missingFields,
                                                        boolean hasActiveSnapshot,
                                                        boolean hasScoringResults) {
        List<Map<String, String>> actions = new ArrayList<>();

        if (!missingFields.isEmpty()) {
            actions.add(Map.of(
                    "action", "complete_onboarding",
                    "label", "Completa il tuo profilo",
                    "description", "Rispondi alle " + missingFields.size() + " domande rimanenti per ottenere risultati piu accurati",
                    "endpoint", "PATCH /api/v1/relocation/onboarding"
            ));
        }

        if ("COMPLETED".equals(profile.getStatus()) && !hasActiveSnapshot) {
            actions.add(Map.of(
                    "action", "create_snapshot",
                    "label", "Conferma le tue risposte",
                    "description", "Crea uno snapshot per calcolare il City Fit Score",
                    "endpoint", "POST /api/v1/relocation/onboarding/snapshots"
            ));
        }

        if (hasActiveSnapshot && !hasScoringResults) {
            actions.add(Map.of(
                    "action", "compute_scoring",
                    "label", "Scopri le citta migliori per te",
                    "description", "Calcola il City Fit Score basato sulle tue preferenze",
                    "endpoint", "POST /api/v1/relocation/city-scoring/compute"
            ));
        }

        if (hasScoringResults) {
            actions.add(Map.of(
                    "action", "view_results",
                    "label", "Visualizza i tuoi risultati",
                    "description", "Consulta il City Fit Score e gli insight personalizzati",
                    "endpoint", "GET /api/v1/relocation/city-scoring/latest/{snapshotId}"
            ));
        }

        return actions;
    }

    /**
     * Initializes a relocation profile from converted anonymous session data.
     * Called by ExpatsConversionService after session conversion.
     */
    @Transactional
    public RelocationProfile initFromConversion(UUID userId, UUID sessionId, Map<String, Object> answers) {
        if (profileRepository.existsByUserId(userId)) {
            return profileRepository.findByUserId(userId).orElseThrow();
        }

        RelocationProfile profile = new RelocationProfile();
        profile.setUser(userRepository.getReferenceById(userId));

        // Map answers from anonymous session to profile fields
        mapAnswersToProfile(profile, answers);

        profile = profileRepository.save(profile);
        return profile;
    }

    private void resolveTargetCity(RelocationProfile profile, String cityName) {
        if (cityName == null || cityName.isBlank()) return;
        String slug = cityName.trim().toLowerCase().replaceAll("\\s+", "-");
        Optional<RelocationCityDataset> bySlug = cityDatasetRepository.findByCitySlugAndActiveTrue(slug);
        if (bySlug.isPresent()) {
            profile.setTargetCity(bySlug.get());
            return;
        }
        // Fallback: user may have entered a country name (e.g. "India", "Pakistan")
        cityDatasetRepository.findFirstByCountryIgnoreCaseAndActiveTrueOrderByCityNameAsc(cityName.trim())
                .ifPresent(profile::setTargetCity);
    }

    private void resolveCurrentCity(RelocationProfile profile, String cityName) {
        if (cityName == null || cityName.isBlank()) return;
        String slug = cityName.trim().toLowerCase().replaceAll("\\s+", "-");
        Optional<RelocationCityDataset> bySlug = cityDatasetRepository.findByCitySlugAndActiveTrue(slug);
        if (bySlug.isPresent()) {
            RelocationCityDataset c = bySlug.get();
            profile.setCurrentCity(c);
            profile.setCurrentCityName(c.getCityName());
            return;
        }
        // Fallback: user may have entered a country name (e.g. "Pakistan")
        cityDatasetRepository.findFirstByCountryIgnoreCaseAndActiveTrueOrderByCityNameAsc(cityName.trim())
                .ifPresent(profile::setCurrentCity);
    }

    public Map<String, Object> buildSnapshotPayload(RelocationProfile profile) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("userType", profile.getUserType());
        payload.put("targetCityName", profile.getTargetCityName());
        payload.put("targetCountry", profile.getTargetCountry());
        payload.put("targetCityId", profile.getTargetCity() != null ? profile.getTargetCity().getId().toString() : null);
        payload.put("currentCityName", profile.getCurrentCityName());
        payload.put("currentCityId", profile.getCurrentCity() != null ? profile.getCurrentCity().getId().toString() : null);
        payload.put("household", profile.getHousehold());
        payload.put("hasPets", profile.getHasPets());
        payload.put("childrenAgeRange", profile.getChildrenAgeRange());
        payload.put("monthlyBudget", profile.getMonthlyBudget());
        payload.put("primaryGoal", profile.getPrimaryGoal());
        payload.put("socialPriority", profile.getSocialPriority());
        payload.put("desiredLifestyle", profile.getDesiredLifestyle());
        payload.put("workStatus", profile.getWorkStatus());
        payload.put("isRemote", profile.getIsRemote());
        payload.put("priorityProblem", profile.getPriorityProblem());
        payload.put("freeNotes", profile.getFreeNotes());
        return payload;
    }

    private void mapAnswersToProfile(RelocationProfile profile, Map<String, Object> answers) {
        profile.setUserType(getStringAnswer(answers, "user_phase", "planning_move"));
        profile.setTargetCityName(getStringAnswer(answers, "city_choice", null));
        profile.setTargetCountry(getStringAnswer(answers, "country_choice", null));
        profile.setHousehold(getStringAnswer(answers, "household", "single"));
        profile.setHasPets(getBooleanAnswer(answers, "has_pets", false));
        profile.setChildrenAgeRange(getStringAnswer(answers, "children_age_range", null));
        profile.setMonthlyBudget(getDecimalAnswer(answers, "monthly_budget", java.math.BigDecimal.ZERO));
        profile.setPrimaryGoal(getStringAnswer(answers, "primary_goal", "quality_of_life"));
        profile.setSocialPriority(getStringAnswer(answers, "social_priority", "medium"));
        profile.setDesiredLifestyle(getStringAnswer(answers, "desired_lifestyle", "balanced"));
        profile.setWorkStatus(getStringAnswer(answers, "work_status", "employed"));
        profile.setIsRemote(getBooleanAnswer(answers, "is_remote", false));
        profile.setPriorityProblem(getStringAnswer(answers, "priority_problem", "monthly_costs"));
        profile.setFreeNotes(getStringAnswer(answers, "free_notes", null));

        // Count how many fields were filled from conversion
        int filled = countFilledFields(profile);
        profile.setCompletedSteps(Math.min(filled, TOTAL_STEPS));
        profile.setCompletionPercent(Math.min(100, (filled * 100) / TOTAL_STEPS));
        profile.setStatus(filled >= TOTAL_STEPS ? "COMPLETED" : "IN_PROGRESS");

        // Resolve target city if available
        if (profile.getTargetCityName() != null) {
            resolveTargetCity(profile, profile.getTargetCityName());
        }
    }

    private String getStringAnswer(Map<String, Object> answers, String key, String defaultValue) {
        Object val = answers.get(key);
        return val instanceof String s ? s : defaultValue;
    }

    private Boolean getBooleanAnswer(Map<String, Object> answers, String key, Boolean defaultValue) {
        Object val = answers.get(key);
        if (val instanceof Boolean b) return b;
        if (val instanceof String s) return Boolean.parseBoolean(s);
        return defaultValue;
    }

    private java.math.BigDecimal getDecimalAnswer(Map<String, Object> answers, String key, java.math.BigDecimal defaultValue) {
        Object val = answers.get(key);
        if (val instanceof Number n) return java.math.BigDecimal.valueOf(n.doubleValue());
        if (val instanceof String s) {
            try { return new java.math.BigDecimal(s); } catch (NumberFormatException e) { return defaultValue; }
        }
        return defaultValue;
    }

    private int countFilledFields(RelocationProfile profile) {
        int count = 0;
        if (profile.getUserType() != null) count++;
        if (profile.getTargetCityName() != null) count++;
        if (profile.getHousehold() != null) count++;
        if (profile.getMonthlyBudget() != null && profile.getMonthlyBudget().compareTo(java.math.BigDecimal.ZERO) > 0) count++;
        if (profile.getPrimaryGoal() != null) count++;
        if (profile.getSocialPriority() != null) count++;
        if (profile.getDesiredLifestyle() != null) count++;
        if (profile.getWorkStatus() != null) count++;
        if (profile.getPriorityProblem() != null) count++;
        if (profile.getFreeNotes() != null) count++;
        return count;
    }

    private RelocationProfile findProfileOrThrow(UUID userId) {
        return profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Relocation profile not found"));
    }
}
