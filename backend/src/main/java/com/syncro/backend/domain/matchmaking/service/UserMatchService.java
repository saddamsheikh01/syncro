package com.syncro.backend.domain.matchmaking.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.matchmaking.dto.DimensionScores;
import com.syncro.backend.domain.matchmaking.dto.DomainScores;
import com.syncro.backend.domain.matchmaking.dto.UserMatchResponse;
import com.syncro.backend.domain.matchmaking.entity.MatchDomain;
import com.syncro.backend.domain.matchmaking.entity.MatchExplanation;
import com.syncro.backend.domain.matchmaking.entity.UserMatchScore;
import com.syncro.backend.domain.matchmaking.mapper.UserMatchMapper;
import com.syncro.backend.domain.matchmaking.repository.MatchExplanationRepository;
import com.syncro.backend.domain.matchmaking.repository.UserMatchCandidateProjection;
import com.syncro.backend.domain.matchmaking.repository.UserMatchScoreRepository;
import com.syncro.backend.domain.media.entity.MediaOwnerType;
import com.syncro.backend.domain.media.repository.MediaObjectRepository;
import com.syncro.backend.domain.profile.dto.UserSummaryResponse;
import com.syncro.backend.domain.profile.entity.Gender;
import com.syncro.backend.domain.profile.entity.Orientation;
import com.syncro.backend.domain.profile.entity.UserPreference;
import com.syncro.backend.domain.profile.entity.UserPosition;
import com.syncro.backend.domain.profile.entity.UserProfile;
import com.syncro.backend.domain.profile.mapper.UserProfileMapper;
import com.syncro.backend.domain.profile.repository.UserPositionRepository;
import com.syncro.backend.domain.profile.repository.UserPreferenceRepository;
import com.syncro.backend.domain.profile.repository.UserProfileRepository;
import com.syncro.backend.domain.tags.entity.UserInterest;
import com.syncro.backend.domain.tags.repository.UserInterestRepository;
import com.syncro.backend.security.UserPrincipal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserMatchService {

    private static final int MIN_CANDIDATES = 20;
    private static final int STALE_DAYS = 7;
    private static final int MATCH_ALGORITHM_VERSION = 2;
    private static final double EARTH_RADIUS_KM = 6371.0;

    private final UserRepository userRepository;
    private final UserInterestRepository userInterestRepository;
    private final UserMatchScoreRepository userMatchScoreRepository;
    private final MatchExplanationRepository matchExplanationRepository;
    private final UserMatchMapper userMatchMapper;
    private final UserProfileRepository userProfileRepository;
    private final UserProfileMapper userProfileMapper;
    private final UserPreferenceRepository userPreferenceRepository;
    private final UserPositionRepository userPositionRepository;
    private final MediaObjectRepository mediaObjectRepository;
    private final DimensionScoreCalculator dimensionScoreCalculator;
    private final DomainScoreCalculator domainScoreCalculator;
    private final MatchExplanationGenerator explanationGenerator;

    public UserMatchService(
        UserRepository userRepository,
        UserInterestRepository userInterestRepository,
        UserMatchScoreRepository userMatchScoreRepository,
        MatchExplanationRepository matchExplanationRepository,
        UserMatchMapper userMatchMapper,
        UserProfileRepository userProfileRepository,
        UserProfileMapper userProfileMapper,
        UserPreferenceRepository userPreferenceRepository,
        UserPositionRepository userPositionRepository,
        MediaObjectRepository mediaObjectRepository,
        DimensionScoreCalculator dimensionScoreCalculator,
        DomainScoreCalculator domainScoreCalculator,
        MatchExplanationGenerator explanationGenerator
    ) {
        this.userRepository = userRepository;
        this.userInterestRepository = userInterestRepository;
        this.userMatchScoreRepository = userMatchScoreRepository;
        this.matchExplanationRepository = matchExplanationRepository;
        this.userMatchMapper = userMatchMapper;
        this.userProfileRepository = userProfileRepository;
        this.userProfileMapper = userProfileMapper;
        this.userPreferenceRepository = userPreferenceRepository;
        this.userPositionRepository = userPositionRepository;
        this.mediaObjectRepository = mediaObjectRepository;
        this.dimensionScoreCalculator = dimensionScoreCalculator;
        this.domainScoreCalculator = domainScoreCalculator;
        this.explanationGenerator = explanationGenerator;
    }

    @Transactional
    public Page<UserMatchResponse> getMatches(
        UserPrincipal principal,
        boolean refresh,
        int page,
        int size,
        String domain
    ) {
        User user = getUser(principal);
        MatchOptions options = resolveMatchOptions(user.getId(), domain);

        PageRequest pageable = PageRequest.of(
            page,
            size,
            Sort.by(Sort.Order.desc("scoreTotal"), Sort.Order.desc("updatedAt"))
        );

        if (!options.openToNewConnections()) {
            return Page.empty(pageable);
        }

        Page<UserMatchScore> existing = userMatchScoreRepository.findByUserId(user.getId(), pageable);
        boolean hasStaleMatches = existing.getContent().stream().anyMatch(this::isMatchStale);

        if (refresh || existing.isEmpty() || hasStaleMatches) {
            computeMatches(user, page, size, options);
            if (hasStaleMatches) {
                refreshStaleMatches(existing.getContent(), user.getId(), options);
            }
            existing = userMatchScoreRepository.findByUserId(user.getId(), pageable);
        }

        return mapResponses(existing, user.getId(), options);
    }

    @Transactional
    public UserMatchResponse getMatchWithUser(UserPrincipal principal, UUID otherUserId, String domain) {
        User user = getUser(principal);
        MatchOptions options = resolveMatchOptions(user.getId(), domain);

        validateOtherUserId(user.getId(), otherUserId);
        userRepository.findById(otherUserId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));

        if (!options.openToNewConnections() || !passesHardFilters(user.getId(), otherUserId, options)) {
            throw new NotFoundException("Match non disponibile con i filtri correnti");
        }

        UUID userAId = orderFirst(user.getId(), otherUserId);
        UUID userBId = orderSecond(user.getId(), otherUserId);
        UserMatchScore match = userMatchScoreRepository
            .findByUserAIdAndUserBId(userAId, userBId)
            .orElse(null);

        if (match == null || isMatchStale(match)) {
            upsertMatchAdvanced(user.getId(), otherUserId, options);
            match = userMatchScoreRepository.findByUserAIdAndUserBId(userAId, userBId)
                .orElseThrow(() -> new NotFoundException("Match non disponibile"));
        }

        return mapSingleResponse(match, user.getId(), options);
    }

    /**
     * Forza il ricalcolo del match con un utente specifico.
     */
    @Transactional
    public UserMatchResponse refreshMatchWithUser(UserPrincipal principal, UUID otherUserId, String domain) {
        User user = getUser(principal);
        MatchOptions options = resolveMatchOptions(user.getId(), domain);

        validateOtherUserId(user.getId(), otherUserId);
        userRepository.findById(otherUserId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));

        if (!options.openToNewConnections() || !passesHardFilters(user.getId(), otherUserId, options)) {
            throw new NotFoundException("Match non disponibile con i filtri correnti");
        }

        upsertMatchAdvanced(user.getId(), otherUserId, options);

        UUID userAId = orderFirst(user.getId(), otherUserId);
        UUID userBId = orderSecond(user.getId(), otherUserId);
        UserMatchScore match = userMatchScoreRepository.findByUserAIdAndUserBId(userAId, userBId)
            .orElseThrow(() -> new NotFoundException("Match non disponibile"));

        return mapSingleResponse(match, user.getId(), options);
    }

    private void validateOtherUserId(UUID currentUserId, UUID otherUserId) {
        if (otherUserId == null || otherUserId.equals(currentUserId)) {
            throw new NotFoundException("Utente non valido");
        }
    }

    /**
     * Verifica se un match e obsoleto e necessita di ricalcolo.
     * Un match e considerato stale se:
     * - scoreTotal e null o 0
     * - breakdown non contiene "dimensions"
     * - e piu vecchio di STALE_DAYS giorni
     */
    private boolean isMatchStale(UserMatchScore match) {
        if (match.getScoreTotal() == null || match.getScoreTotal() == 0) {
            return true;
        }

        Map<String, Object> breakdown = match.getBreakdown();
        if (breakdown == null || breakdown.isEmpty()) {
            return true;
        }
        if (!breakdown.containsKey("dimensions")) {
            return true;
        }
        if (!breakdown.containsKey("domains")) {
            return true;
        }
        Integer algorithmVersion = toInteger(breakdown.get("algorithmVersion"));
        if (algorithmVersion == null || algorithmVersion < MATCH_ALGORITHM_VERSION) {
            return true;
        }

        if (match.getUpdatedAt() != null) {
            Instant threshold = Instant.now().minus(STALE_DAYS, ChronoUnit.DAYS);
            if (match.getUpdatedAt().isBefore(threshold)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Ricalcola i match obsoleti nella lista.
     */
    private void refreshStaleMatches(List<UserMatchScore> matches, UUID currentUserId, MatchOptions options) {
        for (UserMatchScore match : matches) {
            if (!isMatchStale(match)) {
                continue;
            }
            UUID otherUserId = resolveOtherUserId(match, currentUserId);
            if (otherUserId != null && passesHardFilters(currentUserId, otherUserId, options)) {
                upsertMatchAdvanced(currentUserId, otherUserId, options);
            }
        }
    }

    private void computeMatches(User user, int page, int size, MatchOptions options) {
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
            UUID candidateId = candidate.getUserId();
            if (!passesHardFilters(user.getId(), candidateId, options)) {
                continue;
            }
            upsertMatchAdvanced(user.getId(), candidateId, options);
        }
    }

    /**
     * Calcola e salva il match usando l'algoritmo multi-dimensionale.
     */
    private void upsertMatchAdvanced(UUID currentUserId, UUID otherUserId, MatchOptions options) {
        UUID userAId = orderFirst(currentUserId, otherUserId);
        UUID userBId = orderSecond(currentUserId, otherUserId);

        DimensionScores dimensions = dimensionScoreCalculator.calculate(userAId, userBId);
        if (!dimensions.hasAnyDimension()) {
            return;
        }

        DomainScores rawDomains = domainScoreCalculator.calculate(dimensions);
        boolean loveReciprocal = isLoveReciprocal(userAId, userBId);
        DomainScores domains = loveReciprocal
            ? rawDomains
            : new DomainScores(
                null,
                rawDomains.friendship(),
                rawDomains.work(),
                rawDomains.projects(),
                rawDomains.hobby(),
                rawDomains.growth()
            );

        int scoreTotal = domainScoreCalculator.calculateTotalScore(domains, options.activeDomainWeights());
        Map<String, Object> breakdown = buildBreakdown(dimensions, domains, options, loveReciprocal);
        String explanation = explanationGenerator.generateSingle(dimensions, domains);

        UserMatchScore match = userMatchScoreRepository
            .findByUserAIdAndUserBId(userAId, userBId)
            .orElseGet(UserMatchScore::new);

        match.setUserAId(userAId);
        match.setUserBId(userBId);
        match.setScoreTotal(scoreTotal);
        match.setBreakdown(breakdown);

        UserMatchScore saved = userMatchScoreRepository.saveAndFlush(match);
        if (saved.getId() != null) {
            upsertExplanation(saved, explanation);
        }
    }

    /**
     * Costruisce il breakdown completo con dimensioni e domini.
     */
    private Map<String, Object> buildBreakdown(
        DimensionScores dimensions,
        DomainScores domains,
        MatchOptions options,
        boolean loveReciprocal
    ) {
        Map<String, Object> breakdown = new HashMap<>();

        Map<String, Object> dimensionsMap = new HashMap<>();
        if (dimensions.interests() != null) dimensionsMap.put("interests", dimensions.interests());
        if (dimensions.lifestyle() != null) dimensionsMap.put("lifestyle", dimensions.lifestyle());
        if (dimensions.values() != null) dimensionsMap.put("values", dimensions.values());
        if (dimensions.objectives() != null) dimensionsMap.put("objectives", dimensions.objectives());
        if (dimensions.psy() != null) dimensionsMap.put("psy", dimensions.psy());
        if (dimensions.astro() != null) dimensionsMap.put("astro", dimensions.astro());
        breakdown.put("dimensions", dimensionsMap);

        Map<String, Object> domainsMap = new HashMap<>();
        if (domains.love() != null) domainsMap.put("love", domains.love());
        if (domains.friendship() != null) domainsMap.put("friendship", domains.friendship());
        if (domains.work() != null) domainsMap.put("work", domains.work());
        if (domains.projects() != null) domainsMap.put("projects", domains.projects());
        if (domains.hobby() != null) domainsMap.put("hobby", domains.hobby());
        if (domains.growth() != null) domainsMap.put("growth", domains.growth());
        breakdown.put("domains", domainsMap);

        if (dimensions.sharedTags() != null && !dimensions.sharedTags().isEmpty()) {
            breakdown.put("sharedTags", dimensions.sharedTags());
        }

        if (dimensions.distanceKm() != null) {
            breakdown.put("distanceKm", dimensions.distanceKm());
        }

        int totalDimensions = 6;
        int availableDimensions = dimensions.availableCount();
        int completeness = (int) Math.round(100.0 * availableDimensions / totalDimensions);
        breakdown.put("completeness", completeness);
        breakdown.put("availableDimensions", availableDimensions);
        breakdown.put("totalDimensions", totalDimensions);

        Map<String, Object> activeDomains = new LinkedHashMap<>();
        Map<String, Object> domainWeights = new LinkedHashMap<>();
        for (MatchDomain domain : MatchDomain.values()) {
            String key = toDomainKey(domain);
            int weight = Math.max(0, options.activeDomainWeights().getOrDefault(domain, 0));
            activeDomains.put(key, weight > 0);
            domainWeights.put(key, weight);
        }
        breakdown.put("activeDomains", activeDomains);
        breakdown.put("domainWeights", domainWeights);
        breakdown.put("loveReciprocal", loveReciprocal);
        breakdown.put("algorithmVersion", MATCH_ALGORITHM_VERSION);

        return breakdown;
    }

    private void upsertExplanation(UserMatchScore match, String explanation) {
        if (match.getId() == null || explanation == null) {
            return;
        }
        MatchExplanation stored = matchExplanationRepository.findByMatchId(match.getId())
            .orElse(null);
        if (stored == null) {
            stored = new MatchExplanation();
            stored.setMatchId(match.getId());
            stored.setExplanation(explanation);
            stored.setCreatedAt(java.time.Instant.now());
            matchExplanationRepository.saveAndFlush(stored);
        } else {
            stored.setExplanation(explanation);
            matchExplanationRepository.save(stored);
        }
    }

    private Page<UserMatchResponse> mapResponses(Page<UserMatchScore> matches, UUID userId, MatchOptions options) {
        List<UserMatchScore> content = matches.getContent();
        Map<UUID, String> explanations = loadExplanations(content);
        Map<UUID, UserSummaryResponse> summaries = loadUserSummaries(content, userId);

        List<UserMatchResponse> responses = new ArrayList<>();
        for (UserMatchScore match : content) {
            UUID otherUserId = resolveOtherUserId(match, userId);
            if (otherUserId == null || !passesHardFilters(userId, otherUserId, options)) {
                continue;
            }

            Integer resolvedScore = resolveScoreForResponse(match, options);
            if (resolvedScore == null) {
                continue;
            }

            String explanation = explanations.get(match.getId());
            if (explanation == null) {
                explanation = buildExplanation(match);
            }

            responses.add(userMatchMapper.toResponse(
                match,
                userId,
                resolvedScore,
                explanation,
                summaries.get(otherUserId)
            ));
        }

        return new PageImpl<>(responses, matches.getPageable(), matches.getTotalElements());
    }

    private UserMatchResponse mapSingleResponse(UserMatchScore match, UUID userId, MatchOptions options) {
        UUID otherUserId = resolveOtherUserId(match, userId);
        if (otherUserId == null || !passesHardFilters(userId, otherUserId, options)) {
            throw new NotFoundException("Match non disponibile con i filtri correnti");
        }

        Integer resolvedScore = resolveScoreForResponse(match, options);
        if (resolvedScore == null) {
            throw new NotFoundException("Match non disponibile con i filtri correnti");
        }

        String explanation = loadExplanations(List.of(match)).get(match.getId());
        if (explanation == null) {
            explanation = buildExplanation(match);
        }

        UserProfile profile = userProfileRepository.findByUserId(otherUserId).orElse(null);
        String avatarUrl = resolveAvatarUrl(otherUserId);
        String username = profile != null && profile.getUser() != null ? profile.getUser().getUsername() : null;
        UserSummaryResponse summary = userProfileMapper.toSummary(
            otherUserId,
            username,
            profile,
            avatarUrl
        );

        return userMatchMapper.toResponse(match, userId, resolvedScore, explanation, summary);
    }

    private Integer resolveScoreForResponse(UserMatchScore match, MatchOptions options) {
        DomainScores domains = extractDomainScores(match.getBreakdown());
        if (domains == null) {
            return match.getScoreTotal();
        }

        MatchDomain selectedDomain = options.selectedDomain();
        if (selectedDomain != null) {
            int selectedWeight = options.activeDomainWeights().getOrDefault(selectedDomain, 0);
            if (selectedWeight <= 0) {
                return null;
            }
            return domainScoreCalculator.getDomainScore(domains, selectedDomain);
        }

        return domainScoreCalculator.calculateTotalScore(domains, options.activeDomainWeights());
    }

    @SuppressWarnings("unchecked")
    private DomainScores extractDomainScores(Map<String, Object> breakdown) {
        if (breakdown == null) {
            return null;
        }
        Object rawDomains = breakdown.get("domains");
        if (!(rawDomains instanceof Map<?, ?> domainMapRaw)) {
            return null;
        }

        Map<String, Object> domains = (Map<String, Object>) domainMapRaw;
        return new DomainScores(
            toInteger(domains.get("love")),
            toInteger(domains.get("friendship")),
            toInteger(domains.get("work")),
            toInteger(domains.get("projects")),
            toInteger(domains.get("hobby")),
            toInteger(domains.get("growth"))
        );
    }

    @SuppressWarnings("unchecked")
    private String buildExplanation(UserMatchScore match) {
        if (match.getBreakdown() == null) {
            return "Match basato su compatibilita generale";
        }

        Object dimensionsObj = match.getBreakdown().get("dimensions");
        if (dimensionsObj instanceof Map) {
            Map<String, Object> dimensions = (Map<String, Object>) dimensionsObj;
            StringBuilder sb = new StringBuilder();

            String topDimension = null;
            int topScore = 0;
            for (Map.Entry<String, Object> entry : dimensions.entrySet()) {
                if (entry.getValue() instanceof Number score) {
                    if (score.intValue() > topScore) {
                        topScore = score.intValue();
                        topDimension = entry.getKey();
                    }
                }
            }

            if (topDimension != null && topScore >= 70) {
                String label = switch (topDimension) {
                    case "interests" -> "passioni condivise";
                    case "lifestyle" -> "stile di vita";
                    case "values" -> "valori";
                    case "objectives" -> "obiettivi";
                    case "psy" -> "personalita";
                    case "astro" -> "compatibilita astrologica";
                    default -> "compatibilita";
                };
                sb.append("Match basato su ").append(label).append(" (").append(topScore).append("%)");
                return sb.toString();
            }
        }

        Object shared = match.getBreakdown().get("sharedTags");
        if (shared instanceof List sharedList && !sharedList.isEmpty()) {
            return "Match basato su " + sharedList.size() + " passioni condivise";
        }
        if (shared instanceof Number sharedCount) {
            return "Match basato su " + sharedCount.intValue() + " passioni condivise";
        }

        return "Match basato su compatibilita generale";
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
                id -> {
                    String avatarUrl = resolveAvatarUrl(id);
                    UserProfile profile = profiles.get(id);
                    String username =
                        profile != null && profile.getUser() != null ? profile.getUser().getUsername() : null;
                    return userProfileMapper.toSummary(id, username, profile, avatarUrl);
                }
            ));
    }

    private MatchOptions resolveMatchOptions(UUID userId, String selectedDomainRaw) {
        Map<String, Object> filters = userPreferenceRepository.findByUserId(userId)
            .map(UserPreference::getMatchmakingFilters)
            .orElse(Map.of());

        MatchDomain selectedDomain = parseSelectedDomain(selectedDomainRaw);
        Map<MatchDomain, Integer> activeDomainWeights = parseActiveDomainWeights(filters);

        return new MatchOptions(
            selectedDomain,
            activeDomainWeights,
            toInteger(filters.get("ageMin")),
            toInteger(filters.get("ageMax")),
            normalizeUpper(toStringValue(filters.get("gender"))),
            normalizeText(firstNotNull(filters.get("locationCity"), filters.get("city"))),
            normalizeText(firstNotNull(filters.get("locationCountry"), filters.get("country"))),
            toDouble(filters.get("distanceKm")),
            GeoAvailability.fromValue(filters.get("geoAvailability")),
            true
        );
    }

    private Object firstNotNull(Object first, Object second) {
        return first != null ? first : second;
    }

    private MatchDomain parseSelectedDomain(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        MatchDomain domain = parseDomainKey(value);
        if (domain == null) {
            throw new BadRequestException("Dominio match non valido");
        }
        return domain;
    }

    private Map<MatchDomain, Integer> parseActiveDomainWeights(Map<String, Object> filters) {
        Map<String, Object> configuredWeights = toMap(filters.get("domainWeights"));
        Map<MatchDomain, Integer> weights = new EnumMap<>(MatchDomain.class);
        boolean hasPositiveWeight = false;

        for (MatchDomain domain : MatchDomain.values()) {
            Integer configured = toInteger(getByDomainKey(configuredWeights, domain));
            int weight = configured != null ? Math.max(0, configured) : 1;
            if (weight > 0) {
                hasPositiveWeight = true;
            }
            weights.put(domain, weight);
        }

        if (!hasPositiveWeight) {
            for (MatchDomain domain : MatchDomain.values()) {
                weights.put(domain, 1);
            }
        }

        return weights;
    }

    private Object getByDomainKey(Map<String, Object> source, MatchDomain domain) {
        String key = toDomainKey(domain);
        if (source.containsKey(key)) {
            return source.get(key);
        }
        String enumKey = domain.name();
        if (source.containsKey(enumKey)) {
            return source.get(enumKey);
        }
        return null;
    }

    private String toDomainKey(MatchDomain domain) {
        return switch (domain) {
            case LOVE -> "love";
            case FRIENDSHIP -> "friendship";
            case WORK -> "work";
            case PROJECTS -> "projects";
            case HOBBY -> "hobby";
            case GROWTH -> "growth";
        };
    }

    private MatchDomain parseDomainKey(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "love" -> MatchDomain.LOVE;
            case "friendship" -> MatchDomain.FRIENDSHIP;
            case "work" -> MatchDomain.WORK;
            case "projects" -> MatchDomain.PROJECTS;
            case "hobby" -> MatchDomain.HOBBY;
            case "growth" -> MatchDomain.GROWTH;
            default -> null;
        };
    }

    private boolean passesHardFilters(UUID currentUserId, UUID candidateUserId, MatchOptions options) {
        if (candidateUserId == null || currentUserId.equals(candidateUserId)) {
            return false;
        }

        UserProfile currentProfile = userProfileRepository.findByUserId(currentUserId).orElse(null);
        UserProfile candidateProfile = userProfileRepository.findByUserId(candidateUserId).orElse(null);

        if (!passesAgeFilter(candidateProfile, options.ageMin(), options.ageMax())) {
            return false;
        }
        if (!passesGenderFilter(candidateProfile, options.preferredGender())) {
            return false;
        }
        if (!passesLocationFilter(candidateProfile, options.filterCity(), options.filterCountry())) {
            return false;
        }
        if (!passesDistanceFilter(currentUserId, candidateUserId, options)) {
            return false;
        }

        if (options.selectedDomain() == MatchDomain.LOVE) {
            return isLoveReciprocal(currentProfile, candidateProfile);
        }

        return true;
    }

    private boolean passesAgeFilter(UserProfile candidateProfile, Integer ageMin, Integer ageMax) {
        if (ageMin == null && ageMax == null) {
            return true;
        }
        if (candidateProfile == null || candidateProfile.getBirthDate() == null) {
            return false;
        }

        int candidateAge = calculateAge(candidateProfile.getBirthDate());
        if (ageMin != null && candidateAge < ageMin) {
            return false;
        }
        if (ageMax != null && candidateAge > ageMax) {
            return false;
        }
        return true;
    }

    private boolean passesGenderFilter(UserProfile candidateProfile, String preferredGender) {
        if (preferredGender == null || preferredGender.isBlank() || "ANY".equals(preferredGender)) {
            return true;
        }
        if (candidateProfile == null || candidateProfile.getGender() == null) {
            return false;
        }
        return preferredGender.equals(candidateProfile.getGender().name());
    }

    private boolean passesLocationFilter(UserProfile candidateProfile, String cityFilter, String countryFilter) {
        if ((cityFilter == null || cityFilter.isBlank()) && (countryFilter == null || countryFilter.isBlank())) {
            return true;
        }
        if (candidateProfile == null) {
            return false;
        }

        if (cityFilter != null && !cityFilter.isBlank()) {
            String candidateCity = normalizeText(candidateProfile.getCity());
            if (candidateCity == null || !candidateCity.equalsIgnoreCase(cityFilter)) {
                return false;
            }
        }

        if (countryFilter != null && !countryFilter.isBlank()) {
            String candidateCountry = normalizeText(candidateProfile.getCountry());
            if (candidateCountry == null || !candidateCountry.equalsIgnoreCase(countryFilter)) {
                return false;
            }
        }

        return true;
    }

    private boolean passesDistanceFilter(UUID currentUserId, UUID candidateUserId, MatchOptions options) {
        if (options.geoAvailability() == GeoAvailability.REMOTE) {
            return true;
        }

        Double maxDistanceKm = options.distanceKm();
        boolean hasDistanceFilter = maxDistanceKm != null && maxDistanceKm > 0;

        UserPosition currentPosition = userPositionRepository.findByUserId(currentUserId).orElse(null);
        UserPosition candidatePosition = userPositionRepository.findByUserId(candidateUserId).orElse(null);

        boolean hasBothPositions = hasCoordinates(currentPosition) && hasCoordinates(candidatePosition);
        if (!hasBothPositions) {
            if (options.geoAvailability() == GeoAvailability.IN_PERSON) {
                return false;
            }
            return !hasDistanceFilter;
        }

        if (!hasDistanceFilter) {
            return true;
        }

        double distanceKm = calculateDistanceKm(
            currentPosition.getLatitude(),
            currentPosition.getLongitude(),
            candidatePosition.getLatitude(),
            candidatePosition.getLongitude()
        );

        return distanceKm <= maxDistanceKm;
    }

    private boolean hasCoordinates(UserPosition position) {
        return position != null && position.getLatitude() != null && position.getLongitude() != null;
    }

    private double calculateDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a =
            Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1))
                * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2)
                * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }

    private int calculateAge(LocalDate birthDate) {
        return Period.between(birthDate, LocalDate.now()).getYears();
    }

    private boolean isLoveReciprocal(UUID userAId, UUID userBId) {
        UserProfile profileA = userProfileRepository.findByUserId(userAId).orElse(null);
        UserProfile profileB = userProfileRepository.findByUserId(userBId).orElse(null);
        return isLoveReciprocal(profileA, profileB);
    }

    private boolean isLoveReciprocal(UserProfile profileA, UserProfile profileB) {
        if (profileA == null || profileB == null) {
            return false;
        }
        return isLoveInterestCompatible(profileA, profileB) && isLoveInterestCompatible(profileB, profileA);
    }

    private boolean isLoveInterestCompatible(UserProfile source, UserProfile target) {
        Orientation orientation = source.getOrientation();
        Gender sourceGender = source.getGender();
        Gender targetGender = target.getGender();

        if (orientation == null || targetGender == null) {
            return false;
        }

        return switch (orientation) {
            case BI, OTHER -> true;
            case ASEXUAL -> false;
            case HETERO -> isHeteroCompatible(sourceGender, targetGender);
            case GAY -> sourceGender != null && sourceGender == targetGender;
        };
    }

    private boolean isHeteroCompatible(Gender sourceGender, Gender targetGender) {
        if (sourceGender == null || targetGender == null) {
            return false;
        }
        if (sourceGender == Gender.MALE) {
            return targetGender == Gender.FEMALE;
        }
        if (sourceGender == Gender.FEMALE) {
            return targetGender == Gender.MALE;
        }
        return false;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> toMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }

    private Integer toInteger(Object value) {
        if (value instanceof Integer intValue) {
            return intValue;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value instanceof String str && !str.isBlank()) {
            try {
                return Integer.parseInt(str.trim());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private Double toDouble(Object value) {
        if (value instanceof Double doubleValue) {
            return doubleValue;
        }
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        if (value instanceof String str && !str.isBlank()) {
            try {
                return Double.parseDouble(str.trim());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private Boolean toBoolean(Object value, boolean defaultValue) {
        if (value instanceof Boolean bool) {
            return bool;
        }
        if (value instanceof String str) {
            if ("true".equalsIgnoreCase(str)) {
                return true;
            }
            if ("false".equalsIgnoreCase(str)) {
                return false;
            }
        }
        return defaultValue;
    }

    private String toStringValue(Object value) {
        if (value == null) {
            return null;
        }
        String raw = value.toString().trim();
        return raw.isEmpty() ? null : raw;
    }

    private String normalizeUpper(String value) {
        if (value == null) {
            return null;
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeText(Object value) {
        if (value == null) {
            return null;
        }
        String raw = value.toString().trim();
        return raw.isEmpty() ? null : raw;
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

    private String resolveAvatarUrl(UUID userId) {
        if (userId == null) {
            return null;
        }
        return mediaObjectRepository
            .findFirstByOwnerTypeAndOwnerIdOrderByCreatedAtDesc(MediaOwnerType.USER_PROFILE, userId)
            .map(media -> media.getUrl())
            .orElse(null);
    }

    private User getUser(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        UUID userId = principal.userId();
        return userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
    }

    private record MatchOptions(
        MatchDomain selectedDomain,
        Map<MatchDomain, Integer> activeDomainWeights,
        Integer ageMin,
        Integer ageMax,
        String preferredGender,
        String filterCity,
        String filterCountry,
        Double distanceKm,
        GeoAvailability geoAvailability,
        boolean openToNewConnections
    ) {}

    private enum GeoAvailability {
        IN_PERSON,
        REMOTE,
        MIXED;

        private static GeoAvailability fromValue(Object value) {
            if (value == null) {
                return MIXED;
            }

            String normalized = value.toString().trim().toUpperCase(Locale.ROOT);
            if (normalized.isEmpty()) {
                return MIXED;
            }

            return switch (normalized) {
                case "IN_PERSON", "PRESENZA", "PRESENCE" -> IN_PERSON;
                case "REMOTE" -> REMOTE;
                case "MIXED", "MISTO" -> MIXED;
                default -> MIXED;
            };
        }
    }
}
