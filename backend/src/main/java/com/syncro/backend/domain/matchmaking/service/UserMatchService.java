package com.syncro.backend.domain.matchmaking.service;

import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.matchmaking.dto.UserMatchResponse;
import com.syncro.backend.domain.matchmaking.entity.MatchExplanation;
import com.syncro.backend.domain.matchmaking.entity.UserMatchScore;
import com.syncro.backend.domain.matchmaking.mapper.UserMatchMapper;
import com.syncro.backend.domain.matchmaking.repository.MatchExplanationRepository;
import com.syncro.backend.domain.matchmaking.repository.UserMatchCandidateProjection;
import com.syncro.backend.domain.matchmaking.repository.UserMatchScoreRepository;
import com.syncro.backend.domain.profile.dto.UserSummaryResponse;
import com.syncro.backend.domain.profile.entity.UserProfile;
import com.syncro.backend.domain.profile.mapper.UserProfileMapper;
import com.syncro.backend.domain.profile.repository.UserProfileRepository;
import com.syncro.backend.domain.tags.entity.UserInterest;
import com.syncro.backend.domain.tags.repository.UserInterestRepository;
import com.syncro.backend.security.UserPrincipal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserMatchService {

    private static final int SCORE_MULTIPLIER = 10;
    private static final int MIN_CANDIDATES = 20;

    private final UserRepository userRepository;
    private final UserInterestRepository userInterestRepository;
    private final UserMatchScoreRepository userMatchScoreRepository;
    private final MatchExplanationRepository matchExplanationRepository;
    private final UserMatchMapper userMatchMapper;
    private final UserProfileRepository userProfileRepository;
    private final UserProfileMapper userProfileMapper;

    public UserMatchService(
        UserRepository userRepository,
        UserInterestRepository userInterestRepository,
        UserMatchScoreRepository userMatchScoreRepository,
        MatchExplanationRepository matchExplanationRepository,
        UserMatchMapper userMatchMapper,
        UserProfileRepository userProfileRepository,
        UserProfileMapper userProfileMapper
    ) {
        this.userRepository = userRepository;
        this.userInterestRepository = userInterestRepository;
        this.userMatchScoreRepository = userMatchScoreRepository;
        this.matchExplanationRepository = matchExplanationRepository;
        this.userMatchMapper = userMatchMapper;
        this.userProfileRepository = userProfileRepository;
        this.userProfileMapper = userProfileMapper;
    }

    @Transactional
    public Page<UserMatchResponse> getMatches(
        UserPrincipal principal,
        boolean refresh,
        int page,
        int size
    ) {
        User user = getUser(principal);
        PageRequest pageable = PageRequest.of(
            page,
            size,
            Sort.by(Sort.Order.desc("scoreTotal"), Sort.Order.desc("updatedAt"))
        );
        Page<UserMatchScore> existing = userMatchScoreRepository.findByUserId(user.getId(), pageable);
        if (refresh || existing.isEmpty()) {
            computeMatches(user, page, size);
            existing = userMatchScoreRepository.findByUserId(user.getId(), pageable);
        }
        return mapResponses(existing, user.getId());
    }

    private void computeMatches(User user, int page, int size) {
        List<UUID> tagIds = userInterestRepository.findAllByUserId(user.getId())
            .stream()
            .map(UserInterest::getTagId)
            .toList();
        if (tagIds.isEmpty()) {
            return;
        }
        int limit = Math.max(MIN_CANDIDATES, (page + 1) * size);
        List<UserMatchCandidateProjection> candidates = userMatchScoreRepository
            .findCandidates(user.getId(), tagIds, limit);
        for (UserMatchCandidateProjection candidate : candidates) {
            upsertMatch(user.getId(), candidate.getUserId(), candidate.getSharedCount());
        }
    }

    private void upsertMatch(UUID currentUserId, UUID otherUserId, int sharedCount) {
        if (sharedCount <= 0) {
            return;
        }
        UUID userAId = orderFirst(currentUserId, otherUserId);
        UUID userBId = orderSecond(currentUserId, otherUserId);
        UserMatchScore match = userMatchScoreRepository
            .findByUserAIdAndUserBId(userAId, userBId)
            .orElseGet(UserMatchScore::new);
        match.setUserAId(userAId);
        match.setUserBId(userBId);
        match.setScoreTotal(sharedCount * SCORE_MULTIPLIER);
        match.setBreakdown(Map.of("sharedTags", sharedCount));
        UserMatchScore saved = userMatchScoreRepository.saveAndFlush(match);
        if (saved.getId() == null) {
            saved = userMatchScoreRepository.findByUserAIdAndUserBId(userAId, userBId)
                .orElse(saved);
        }
        if (saved.getId() == null) {
            return;
        }
        // Explanation is computed on the fly to avoid persistence issues in demo data.
    }

    private void upsertExplanation(UserMatchScore match, int sharedCount) {
        if (match.getId() == null) {
            return;
        }
        String explanation = "Match basato su " + sharedCount + " interessi condivisi";
        MatchExplanation stored = matchExplanationRepository.findByMatchId(match.getId())
            .orElseGet(MatchExplanation::new);
        stored.setMatchScore(match);
        stored.setExplanation(explanation);
        matchExplanationRepository.save(stored);
    }

    private Page<UserMatchResponse> mapResponses(Page<UserMatchScore> matches, UUID userId) {
        Map<UUID, String> explanations = loadExplanations(matches.getContent());
        Map<UUID, UserSummaryResponse> summaries = loadUserSummaries(matches.getContent(), userId);
        return matches.map(match -> {
            String explanation = explanations.get(match.getId());
            if (explanation == null) {
                explanation = buildExplanation(match);
            }
            return userMatchMapper.toResponse(
                match,
                userId,
                explanation,
                summaries.get(resolveOtherUserId(match, userId))
            );
        });
    }

    private String buildExplanation(UserMatchScore match) {
        if (match.getBreakdown() == null) {
            return "Match basato su interessi condivisi";
        }
        Object shared = match.getBreakdown().get("sharedTags");
        if (shared instanceof Number sharedCount) {
            return "Match basato su " + sharedCount.intValue() + " interessi condivisi";
        }
        return "Match basato su interessi condivisi";
    }

    private Map<UUID, String> loadExplanations(List<UserMatchScore> matches) {
        if (matches.isEmpty()) {
            return Map.of();
        }
        List<UUID> matchIds = matches.stream().map(UserMatchScore::getId).toList();
        return matchExplanationRepository.findAllByMatchIdIn(matchIds)
            .stream()
            .collect(Collectors.toMap(
                MatchExplanation::getMatchId,
                MatchExplanation::getExplanation,
                (first, second) -> first,
                HashMap::new
            ));
    }

    private Map<UUID, UserSummaryResponse> loadUserSummaries(List<UserMatchScore> matches, UUID currentUserId) {
        if (matches.isEmpty()) {
            return Map.of();
        }
        Set<UUID> userIds = matches.stream()
            .map(match -> resolveOtherUserId(match, currentUserId))
            .filter(id -> id != null)
            .collect(Collectors.toSet());
        if (userIds.isEmpty()) {
            return Map.of();
        }

        Map<UUID, UserProfile> profiles = new HashMap<>();
        userProfileRepository.findByUserIdIn(userIds)
            .forEach(profile -> {
                if (profile.getUser() != null && profile.getUser().getId() != null) {
                    profiles.putIfAbsent(profile.getUser().getId(), profile);
                }
            });

        return userIds.stream()
            .collect(Collectors.toMap(
                id -> id,
                id -> userProfileMapper.toSummary(id, profiles.get(id))
            ));
    }

    private UUID orderFirst(UUID first, UUID second) {
        if (first.compareTo(second) <= 0) {
            return first;
        }
        return second;
    }

    private UUID orderSecond(UUID first, UUID second) {
        if (first.compareTo(second) <= 0) {
            return second;
        }
        return first;
    }

    private UUID resolveOtherUserId(UserMatchScore matchScore, UUID currentUserId) {
        if (currentUserId == null) {
            return matchScore.getUserBId();
        }
        if (currentUserId.equals(matchScore.getUserAId())) {
            return matchScore.getUserBId();
        }
        return matchScore.getUserAId();
    }

    private User getUser(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        UUID userId = principal.userId();
        return userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
    }
}
