package com.syncro.backend.domain.matchmaking.service;

import com.syncro.backend.domain.matchmaking.dto.UserMatchResponse;
import com.syncro.backend.domain.matchmaking.entity.MatchDomain;
import com.syncro.backend.domain.matchmaking.entity.MatchExplanation;
import com.syncro.backend.domain.matchmaking.entity.UserMatchScore;
import com.syncro.backend.domain.matchmaking.mapper.UserMatchMapper;
import com.syncro.backend.domain.matchmaking.repository.MatchExplanationRepository;
import com.syncro.backend.domain.matchmaking.repository.UserMatchScoreRepository;
import com.syncro.backend.domain.profile.dto.UserSummaryResponse;
import com.syncro.backend.domain.profile.service.UserProfileService;
import com.syncro.backend.security.UserPrincipal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PeopleService {

    private static final int MAX_POOL_SIZE = 500;

    private final UserProfileService userProfileService;
    private final UserMatchScoreRepository userMatchScoreRepository;
    private final MatchExplanationRepository matchExplanationRepository;
    private final UserMatchMapper userMatchMapper;

    public PeopleService(
        UserProfileService userProfileService,
        UserMatchScoreRepository userMatchScoreRepository,
        MatchExplanationRepository matchExplanationRepository,
        UserMatchMapper userMatchMapper
    ) {
        this.userProfileService = userProfileService;
        this.userMatchScoreRepository = userMatchScoreRepository;
        this.matchExplanationRepository = matchExplanationRepository;
        this.userMatchMapper = userMatchMapper;
    }

    @Transactional(readOnly = true)
    public Page<UserMatchResponse> getPeople(
        UserPrincipal principal,
        String q,
        String city,
        String country,
        Integer ageMin,
        Integer ageMax,
        String gender,
        String orientation,
        String zodiacSign,
        List<UUID> interestTagIds,
        String valuesText,
        String context,
        Double latitude,
        Double longitude,
        Double maxDistanceKm,
        String sort,
        int page,
        int size
    ) {
        UUID currentUserId = principal.userId();
        Pageable poolPageable = PageRequest.of(0, MAX_POOL_SIZE);

        if ("recently_active".equalsIgnoreCase(sort != null ? sort.trim() : "")) {
            Pageable requestedPage = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "user.updatedAt"));
            Page<UserSummaryResponse> profilePage = userProfileService.searchUsersWithFilters(
                currentUserId,
                q, city, country, ageMin, ageMax,
                parseGender(gender), parseOrientation(orientation), parseZodiac(zodiacSign),
                interestTagIds, valuesText,
                latitude, longitude, maxDistanceKm,
                requestedPage
            );
            return mapToMatchPage(profilePage.getContent(), currentUserId, context, profilePage.getTotalElements(), requestedPage);
        }

        Page<UserSummaryResponse> poolPage = userProfileService.searchUsersWithFilters(
            currentUserId,
            q, city, country, ageMin, ageMax,
            parseGender(gender), parseOrientation(orientation), parseZodiac(zodiacSign),
            interestTagIds, valuesText,
            latitude, longitude, maxDistanceKm,
            poolPageable
        );
        List<UserSummaryResponse> pool = poolPage.getContent();
        if (pool.isEmpty()) {
            return new PageImpl<>(List.of(), PageRequest.of(page, size), 0);
        }

        List<UUID> userIds = pool.stream().map(UserSummaryResponse::userId).toList();
        Map<UUID, UserMatchScore> scoreMap = loadMatchScoresFor(currentUserId, userIds);
        Map<UUID, String> explanations = loadExplanations(scoreMap.values().stream().toList());
        MatchDomain domain = parseDomain(context);

        List<UserMatchResponse> merged = new ArrayList<>();
        for (UserSummaryResponse summary : pool) {
            if (summary.userId().equals(currentUserId)) {
                continue;
            }
            UserMatchScore match = scoreMap.get(summary.userId());
            if (match != null) {
                Integer score = resolveScore(match, domain);
                if (score == null) score = match.getScoreTotal() != null ? match.getScoreTotal() : 0;
                String explanation = explanations.get(match.getId());
                merged.add(userMatchMapper.toResponse(match, currentUserId, score, explanation, summary));
            } else {
                merged.add(toResponseNoMatch(summary));
            }
        }

        merged.sort(Comparator
            .comparing(UserMatchResponse::scoreTotal, Comparator.nullsLast(Comparator.reverseOrder()))
            .thenComparing(m -> m.updatedAt() != null ? m.updatedAt() : java.time.Instant.EPOCH, Comparator.reverseOrder()));

        int total = merged.size();
        int from = page * size;
        int to = Math.min(from + size, total);
        List<UserMatchResponse> pageContent = from < total ? merged.subList(from, to) : List.of();

        return new PageImpl<>(pageContent, PageRequest.of(page, size), total);
    }

    private Page<UserMatchResponse> mapToMatchPage(
        List<UserSummaryResponse> content,
        UUID currentUserId,
        String context,
        long totalElements,
        Pageable pageable
    ) {
        if (content.isEmpty()) {
            return new PageImpl<>(List.of(), pageable, totalElements);
        }
        MatchDomain domain = parseDomain(context);
        List<UUID> userIds = content.stream().map(UserSummaryResponse::userId).toList();
        Map<UUID, UserMatchScore> scoreMap = loadMatchScoresFor(currentUserId, userIds);
        Map<UUID, String> explanations = loadExplanations(scoreMap.values().stream().toList());

        List<UserMatchResponse> list = new ArrayList<>();
        for (UserSummaryResponse summary : content) {
            if (summary.userId().equals(currentUserId)) {
                continue;
            }
            UserMatchScore match = scoreMap.get(summary.userId());
            if (match != null) {
                Integer score = resolveScore(match, domain);
                if (score == null) score = match.getScoreTotal() != null ? match.getScoreTotal() : 0;
                String explanation = explanations.get(match.getId());
                list.add(userMatchMapper.toResponse(match, currentUserId, score, explanation, summary));
            } else {
                list.add(toResponseNoMatch(summary));
            }
        }
        return new PageImpl<>(list, pageable, totalElements);
    }

    private static MatchDomain parseDomain(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return MatchDomain.valueOf(value.trim().toUpperCase(java.util.Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private static Integer resolveScore(UserMatchScore match, MatchDomain domain) {
        if (domain == null || match.getBreakdown() == null) {
            return null;
        }
        Object raw = match.getBreakdown().get("domains");
        if (!(raw instanceof Map<?, ?> domainsMap)) {
            return null;
        }
        String key = domain.name().toLowerCase(java.util.Locale.ROOT);
        Object val = domainsMap.get(key);
        if (val instanceof Number n) {
            return n.intValue();
        }
        return null;
    }

    private Map<UUID, UserMatchScore> loadMatchScoresFor(UUID currentUserId, List<UUID> otherUserIds) {
        if (otherUserIds.isEmpty()) {
            return Map.of();
        }
        Page<UserMatchScore> myMatches = userMatchScoreRepository.findByUserId(
            currentUserId, PageRequest.of(0, 2000));
        Map<UUID, UserMatchScore> map = new HashMap<>();
        for (UserMatchScore m : myMatches.getContent()) {
            UUID other = currentUserId.equals(m.getUserAId()) ? m.getUserBId() : m.getUserAId();
            if (otherUserIds.contains(other)) {
                map.put(other, m);
            }
        }
        return map;
    }

    private Map<UUID, String> loadExplanations(List<UserMatchScore> matches) {
        if (matches.isEmpty()) {
            return Map.of();
        }
        List<UUID> matchIds = matches.stream().map(UserMatchScore::getId).toList();
        return matchExplanationRepository.findAllByMatchIdIn(matchIds).stream()
            .collect(Collectors.toMap(MatchExplanation::getMatchId, MatchExplanation::getExplanation, (a, b) -> a, HashMap::new));
    }

    private UserMatchResponse toResponseNoMatch(UserSummaryResponse summary) {
        UUID sentinelId = UUID.nameUUIDFromBytes(("no-match-" + summary.userId()).getBytes(StandardCharsets.UTF_8));
        return new UserMatchResponse(
            sentinelId,
            summary.userId(),
            summary,
            null,
            null,
            null,
            null,
            null
        );
    }

    private static com.syncro.backend.domain.profile.entity.Gender parseGender(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return com.syncro.backend.domain.profile.entity.Gender.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static com.syncro.backend.domain.profile.entity.Orientation parseOrientation(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return com.syncro.backend.domain.profile.entity.Orientation.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static com.syncro.backend.domain.profile.entity.ZodiacSign parseZodiac(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            com.syncro.backend.domain.profile.entity.ZodiacSign sign =
                com.syncro.backend.domain.profile.entity.ZodiacSign.valueOf(value.trim().toUpperCase());
            return sign == com.syncro.backend.domain.profile.entity.ZodiacSign.UNKNOWN ? null : sign;
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
