package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.domain.expats.entity.ExpatsAnonymousSession;
import com.syncro.backend.domain.expats.repository.ExpatsAnonymousAnswerRepository;
import com.syncro.backend.domain.expats.repository.ExpatsAnonymousSessionRepository;
import com.syncro.backend.domain.relocation.dto.*;
import com.syncro.backend.domain.relocation.entity.RelocationOnboardingSnapshot;
import com.syncro.backend.domain.relocation.entity.RelocationProfile;
import com.syncro.backend.domain.relocation.mapper.RelocationMapper;
import com.syncro.backend.domain.relocation.repository.RelocationCityDatasetRepository;
import com.syncro.backend.domain.relocation.repository.RelocationOnboardingSnapshotRepository;
import com.syncro.backend.domain.relocation.repository.RelocationProfileRepository;
import com.syncro.backend.domain.relocation.repository.RelocationCityScoreRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

/**
 * Relocation + scoring for anonymous expat sessions (WOW before registration).
 */
@Service
public class AnonymousRelocationService {

    private final ExpatsAnonymousSessionRepository sessionRepository;
    private final ExpatsAnonymousAnswerRepository answerRepository;
    private final RelocationProfileRepository profileRepository;
    private final RelocationOnboardingSnapshotRepository snapshotRepository;
    private final RelocationCityScoreRepository cityScoreRepository;
    private final RelocationOnboardingService onboardingService;
    private final RelocationMapper mapper;
    private final ExpatsFunnelToRelocationProfileMapper funnelMapper;
    private final RelocationCityDatasetRepository cityDatasetRepository;
    private final AnonymousRelocationService self;

    public AnonymousRelocationService(ExpatsAnonymousSessionRepository sessionRepository,
                                      ExpatsAnonymousAnswerRepository answerRepository,
                                      RelocationProfileRepository profileRepository,
                                      RelocationOnboardingSnapshotRepository snapshotRepository,
                                      RelocationCityScoreRepository cityScoreRepository,
                                      RelocationOnboardingService onboardingService,
                                      RelocationMapper mapper,
                                      ExpatsFunnelToRelocationProfileMapper funnelMapper,
                                      RelocationCityDatasetRepository cityDatasetRepository,
                                      @Lazy AnonymousRelocationService self) {
        this.sessionRepository = sessionRepository;
        this.answerRepository = answerRepository;
        this.profileRepository = profileRepository;
        this.snapshotRepository = snapshotRepository;
        this.cityScoreRepository = cityScoreRepository;
        this.onboardingService = onboardingService;
        this.mapper = mapper;
        this.funnelMapper = funnelMapper;
        this.cityDatasetRepository = cityDatasetRepository;
        this.self = self;
    }

    @Transactional
    public RelocationProfile syncProfile(UUID sessionId) {
        ExpatsAnonymousSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));
        if ("CONVERTED".equals(session.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Session converted; use authenticated APIs");
        }
        var answers = answerRepository.findBySessionIdOrderByStepNumberAsc(sessionId);
        RelocationProfile profile = profileRepository.findByAnonymousSession_Id(sessionId).orElseGet(() -> {
            RelocationProfile p = new RelocationProfile();
            p.setAnonymousSession(session);
            return p;
        });
        funnelMapper.applyAnswers(profile, answers);
        try {
            return profileRepository.save(profile);
        } catch (DataIntegrityViolationException e) {
            // Duplicate key (uq_relocation_profiles_anon_session): another request created the profile; find in new tx
            return self.findProfileBySessionIdInNewTx(sessionId);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
    public RelocationProfile findProfileBySessionIdInNewTx(UUID sessionId) {
        return profileRepository.findByAnonymousSession_Id(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Profile race; retry"));
    }

    @Transactional
    public RelocationOnboardingSnapshot refreshActiveSnapshot(UUID sessionId) {
        RelocationProfile profile = syncProfile(sessionId);
        ExpatsAnonymousSession session = sessionRepository.getReferenceById(sessionId);
        var answers = answerRepository.findBySessionIdOrderByStepNumberAsc(sessionId);

        // Deactivate ALL active snapshots (guard against duplicates)
        snapshotRepository.findByAnonymousSession_IdOrderByVersionDesc(sessionId).stream()
                .filter(s -> Boolean.TRUE.equals(s.getIsActive()))
                .forEach(s -> {
                    s.setIsActive(false);
                    snapshotRepository.save(s);
                });

        Map<String, Object> payload = new LinkedHashMap<>(onboardingService.buildSnapshotPayload(profile));
        payload.putAll(funnelMapper.funnelExtrasForPayload(answers));

        int nextVersion = snapshotRepository.findMaxVersionByAnonymousSessionId(sessionId) + 1;
        RelocationOnboardingSnapshot snap = new RelocationOnboardingSnapshot();
        snap.setUser(null);
        snap.setAnonymousSession(session);
        snap.setRelocationProfile(profile);
        snap.setVersion(nextVersion);
        snap.setPayload(payload);
        snap.setIsActive(true);
        snap.setCreatedAt(java.time.Instant.now());
        return snapshotRepository.save(snap);
    }

    @Transactional
    public OnboardingResponse getOnboarding(UUID sessionId) {
        RelocationProfile p = syncProfile(sessionId);
        return mapper.toOnboardingResponse(p);
    }

    @Transactional
    public OnboardingStatusResponse getOnboardingStatus(UUID sessionId) {
        RelocationProfile profile = profileRepository.findByAnonymousSession_Id(sessionId)
                .orElseGet(() -> syncProfile(sessionId));
        boolean hasActive = findActiveSnapshotSafe(sessionId).isPresent();
        int maxV = snapshotRepository.findMaxVersionByAnonymousSessionId(sessionId);
        return mapper.toOnboardingStatusResponse(profile, hasActive, maxV > 0 ? maxV : null);
    }

    @Transactional
    public ActivationStateResponse getActivationState(UUID sessionId) {
        RelocationProfile profile = profileRepository.findByAnonymousSession_Id(sessionId)
                .orElseGet(() -> syncProfile(sessionId));
        boolean hasActive = findActiveSnapshotSafe(sessionId).isPresent();
        boolean hasScores = !cityScoreRepository.findByAnonymousSession_IdOrderByCreatedAtDesc(sessionId).isEmpty();

        List<String> completed = new ArrayList<>();
        List<String> missing = new ArrayList<>();
        check(profile.getUserType() != null, "user_phase", completed, missing);
        check(profile.getTargetCityName() != null || profile.getCurrentCityName() != null, "city", completed, missing);
        check(profile.getHousehold() != null, "household", completed, missing);
        check(profile.getMonthlyBudget() != null && profile.getMonthlyBudget().signum() > 0, "budget", completed, missing);
        check(profile.getPrimaryGoal() != null, "primary_goal", completed, missing);

        List<Map<String, String>> nextActions = new ArrayList<>();
        if (!hasActive) {
            nextActions.add(Map.of(
                    "action", "compute_scoring",
                    "label", "Get your city fit",
                    "description", "We will score cities from your funnel answers.",
                    "endpoint", "POST /api/v1/relocation/city-scoring/compute"
            ));
        } else if (!hasScores) {
            nextActions.add(Map.of(
                    "action", "compute_scoring",
                    "label", "Run scoring",
                    "description", "Compute your personalized city scores.",
                    "endpoint", "POST /api/v1/relocation/city-scoring/compute"
            ));
        } else {
            nextActions.add(Map.of(
                    "action", "view_results",
                    "label", "View WOW results",
                    "description", "Your scores are ready.",
                    "endpoint", "GET /api/v1/relocation/city-scoring/history"
            ));
        }

        return new ActivationStateResponse(
                profile.getStatus(),
                profile.getUserType(),
                profile.getCompletedSteps(),
                10,
                profile.getCompletionPercent(),
                completed,
                missing,
                nextActions,
                hasActive,
                hasScores,
                profile.getUpdatedAt()
        );
    }

    /** Safe lookup that handles the case of multiple active snapshots (returns first by version desc). */
    private Optional<RelocationOnboardingSnapshot> findActiveSnapshotSafe(UUID sessionId) {
        return snapshotRepository.findByAnonymousSession_IdOrderByVersionDesc(sessionId).stream()
                .filter(s -> Boolean.TRUE.equals(s.getIsActive()))
                .findFirst();
    }

    private static void check(boolean ok, String field, List<String> done, List<String> miss) {
        if (ok) {
            done.add(field);
        } else {
            miss.add(field);
        }
    }

    @Transactional(readOnly = true)
    public List<CityScoreResponse> getHistory(UUID sessionId) {
        return cityScoreRepository.findByAnonymousSession_IdOrderByCreatedAtDesc(sessionId).stream()
                .map(mapper::toCityScoreResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SnapshotResponse> listSnapshots(UUID sessionId) {
        return snapshotRepository.findByAnonymousSession_IdOrderByVersionDesc(sessionId).stream()
                .map(mapper::toSnapshotResponse)
                .toList();
    }

    @Transactional
    public SnapshotResponse refreshSnapshotAsCreate(UUID sessionId) {
        RelocationOnboardingSnapshot snap = refreshActiveSnapshot(sessionId);
        return mapper.toSnapshotResponse(snap);
    }

    @Transactional
    public OnboardingResponse patchOnboarding(UUID sessionId, UpdateOnboardingRequest request) {
        RelocationProfile profile = syncProfile(sessionId);
        if (request.userType() != null) {
            profile.setUserType(request.userType());
        }
        if (request.targetCityName() != null) {
            profile.setTargetCityName(request.targetCityName());
        }
        if (request.targetCountry() != null) {
            profile.setTargetCountry(request.targetCountry());
        }
        if (request.household() != null) {
            profile.setHousehold(request.household());
        }
        if (request.hasPets() != null) {
            profile.setHasPets(request.hasPets());
        }
        if (request.childrenAgeRange() != null) {
            profile.setChildrenAgeRange(request.childrenAgeRange());
        }
        if (request.monthlyBudget() != null) {
            profile.setMonthlyBudget(request.monthlyBudget());
        }
        if (request.primaryGoal() != null) {
            profile.setPrimaryGoal(request.primaryGoal());
        }
        if (request.socialPriority() != null) {
            profile.setSocialPriority(request.socialPriority());
        }
        if (request.desiredLifestyle() != null) {
            profile.setDesiredLifestyle(request.desiredLifestyle());
        }
        if (request.workStatus() != null) {
            profile.setWorkStatus(request.workStatus());
        }
        if (request.isRemote() != null) {
            profile.setIsRemote(request.isRemote());
        }
        if (request.priorityProblem() != null) {
            profile.setPriorityProblem(request.priorityProblem());
        }
        if (request.freeNotes() != null) {
            profile.setFreeNotes(request.freeNotes());
        }
        if (request.targetCityId() != null) {
            cityDatasetRepository.findById(request.targetCityId()).ifPresent(city -> {
                profile.setTargetCity(city);
                profile.setTargetCityName(city.getCityName());
            });
        } else if (request.targetCityName() != null) {
            String slug = request.targetCityName().toLowerCase().replaceAll("\\s+", "-");
            cityDatasetRepository.findByCitySlugAndActiveTrue(slug).ifPresent(profile::setTargetCity);
        }
        if (request.currentCityId() != null) {
            cityDatasetRepository.findById(request.currentCityId()).ifPresent(c -> {
                profile.setCurrentCity(c);
                profile.setCurrentCityName(c.getCityName());
            });
        }
        if (request.currentCityName() != null && request.currentCityId() == null) {
            profile.setCurrentCityName(request.currentCityName());
            String slug = request.currentCityName().toLowerCase().replaceAll("\\s+", "-");
            cityDatasetRepository.findByCitySlugAndActiveTrue(slug).ifPresent(profile::setCurrentCity);
        }
        if (request.completedSteps() != null) {
            profile.setCompletedSteps(request.completedSteps());
            profile.setCompletionPercent(Math.min(100, (request.completedSteps() * 100) / 10));
        }
        profileRepository.save(profile);
        return mapper.toOnboardingResponse(profile);
    }
}
