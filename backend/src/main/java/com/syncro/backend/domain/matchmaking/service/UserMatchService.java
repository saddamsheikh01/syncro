package com.syncro.backend.domain.matchmaking.service;

import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.matchmaking.dto.DimensionScores;
import com.syncro.backend.domain.matchmaking.dto.DomainScores;
import com.syncro.backend.domain.matchmaking.dto.UserMatchResponse;
import com.syncro.backend.domain.matchmaking.entity.MatchExplanation;
import com.syncro.backend.domain.matchmaking.entity.UserMatchScore;
import com.syncro.backend.domain.matchmaking.mapper.UserMatchMapper;
import com.syncro.backend.domain.matchmaking.repository.MatchExplanationRepository;
import com.syncro.backend.domain.matchmaking.repository.UserMatchCandidateProjection;
import com.syncro.backend.domain.matchmaking.repository.UserMatchScoreRepository;
import com.syncro.backend.domain.media.entity.MediaOwnerType;
import com.syncro.backend.domain.media.repository.MediaObjectRepository;
import com.syncro.backend.domain.profile.dto.UserSummaryResponse;
import com.syncro.backend.domain.profile.entity.UserProfile;
import com.syncro.backend.domain.profile.mapper.UserProfileMapper;
import com.syncro.backend.domain.profile.repository.UserProfileRepository;
import com.syncro.backend.domain.tags.entity.UserInterest;
import com.syncro.backend.domain.tags.repository.UserInterestRepository;
import com.syncro.backend.security.UserPrincipal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
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

    private static final int MIN_CANDIDATES = 20;
    private static final int STALE_DAYS = 7;

    private final UserRepository userRepository;
    private final UserInterestRepository userInterestRepository;
    private final UserMatchScoreRepository userMatchScoreRepository;
    private final MatchExplanationRepository matchExplanationRepository;
    private final UserMatchMapper userMatchMapper;
    private final UserProfileRepository userProfileRepository;
    private final UserProfileMapper userProfileMapper;
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
        int size
    ) {
        User user = getUser(principal);
        PageRequest pageable = PageRequest.of(
            page,
            size,
            Sort.by(Sort.Order.desc("scoreTotal"), Sort.Order.desc("updatedAt"))
        );
        Page<UserMatchScore> existing = userMatchScoreRepository.findByUserId(user.getId(), pageable);

        // Verifica se ci sono match obsoleti da ricalcolare
        boolean hasStaleMatches = existing.getContent().stream().anyMatch(this::isMatchStale);

        if (refresh || existing.isEmpty() || hasStaleMatches) {
            computeMatches(user, page, size);
            // Ricalcola anche i match stale esistenti
            if (hasStaleMatches) {
                refreshStaleMatches(existing.getContent(), user.getId());
            }
            existing = userMatchScoreRepository.findByUserId(user.getId(), pageable);
        }
        return mapResponses(existing, user.getId());
    }

    @Transactional
    public UserMatchResponse getMatchWithUser(UserPrincipal principal, UUID otherUserId) {
        User user = getUser(principal);
        if (otherUserId == null) {
            throw new NotFoundException("Utente non valido");
        }
        if (otherUserId.equals(user.getId())) {
            throw new NotFoundException("Utente non valido");
        }
        userRepository.findById(otherUserId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));

        UUID userAId = orderFirst(user.getId(), otherUserId);
        UUID userBId = orderSecond(user.getId(), otherUserId);
        UserMatchScore match = userMatchScoreRepository
            .findByUserAIdAndUserBId(userAId, userBId)
            .orElse(null);

        if (match == null) {
            // Calcola il match con il nuovo algoritmo multi-dimensionale
            upsertMatchAdvanced(user.getId(), otherUserId);
            match = userMatchScoreRepository.findByUserAIdAndUserBId(userAId, userBId)
                .orElseThrow(() -> new NotFoundException("Match non disponibile"));
        }

        return mapSingleResponse(match, user.getId());
    }

    /**
     * Forza il ricalcolo del match con un utente specifico.
     */
    @Transactional
    public UserMatchResponse refreshMatchWithUser(UserPrincipal principal, UUID otherUserId) {
        User user = getUser(principal);
        if (otherUserId == null) {
            throw new NotFoundException("Utente non valido");
        }
        if (otherUserId.equals(user.getId())) {
            throw new NotFoundException("Utente non valido");
        }
        userRepository.findById(otherUserId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));

        // Forza il ricalcolo
        upsertMatchAdvanced(user.getId(), otherUserId);

        // Recupera e restituisci il match aggiornato
        UUID userAId = orderFirst(user.getId(), otherUserId);
        UUID userBId = orderSecond(user.getId(), otherUserId);
        UserMatchScore match = userMatchScoreRepository.findByUserAIdAndUserBId(userAId, userBId)
            .orElseThrow(() -> new NotFoundException("Match non disponibile"));

        return mapSingleResponse(match, user.getId());
    }

    /**
     * Verifica se un match e obsoleto e necessita di ricalcolo.
     * Un match e considerato stale se:
     * - scoreTotal e null o 0
     * - breakdown non contiene "dimensions"
     * - e piu vecchio di STALE_DAYS giorni
     */
    private boolean isMatchStale(UserMatchScore match) {
        // Match con score 0 o null sono sempre stale
        if (match.getScoreTotal() == null || match.getScoreTotal() == 0) {
            return true;
        }

        // Match senza breakdown con dimensions sono stale
        Map<String, Object> breakdown = match.getBreakdown();
        if (breakdown == null || breakdown.isEmpty()) {
            return true;
        }
        if (!breakdown.containsKey("dimensions")) {
            return true;
        }

        // Match piu vecchi di STALE_DAYS giorni sono stale
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
    private void refreshStaleMatches(List<UserMatchScore> matches, UUID currentUserId) {
        for (UserMatchScore match : matches) {
            if (isMatchStale(match)) {
                UUID otherUserId = resolveOtherUserId(match, currentUserId);
                if (otherUserId != null) {
                    upsertMatchAdvanced(currentUserId, otherUserId);
                }
            }
        }
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
            upsertMatchAdvanced(user.getId(), candidate.getUserId());
        }
    }

    /**
     * Calcola e salva il match usando l'algoritmo multi-dimensionale.
     */
    private void upsertMatchAdvanced(UUID currentUserId, UUID otherUserId) {
        UUID userAId = orderFirst(currentUserId, otherUserId);
        UUID userBId = orderSecond(currentUserId, otherUserId);

        // Calcola i punteggi per ogni dimensione
        DimensionScores dimensions = dimensionScoreCalculator.calculate(userAId, userBId);

        // Se non ci sono dimensioni disponibili, non creare il match
        if (!dimensions.hasAnyDimension()) {
            return;
        }

        // Calcola i punteggi per ogni dominio
        DomainScores domains = domainScoreCalculator.calculate(dimensions);

        // Calcola il punteggio totale
        int scoreTotal = domainScoreCalculator.calculateTotalScore(domains);

        // Costruisci il breakdown completo
        Map<String, Object> breakdown = buildBreakdown(dimensions, domains);

        // Genera le spiegazioni
        String explanation = explanationGenerator.generateSingle(dimensions, domains);

        // Salva il match
        UserMatchScore match = userMatchScoreRepository
            .findByUserAIdAndUserBId(userAId, userBId)
            .orElseGet(UserMatchScore::new);
        match.setUserAId(userAId);
        match.setUserBId(userBId);
        match.setScoreTotal(scoreTotal);
        match.setBreakdown(breakdown);
        UserMatchScore saved = userMatchScoreRepository.saveAndFlush(match);

        // Salva la spiegazione
        if (saved.getId() != null) {
            upsertExplanation(saved, explanation);
        }
    }

    /**
     * Costruisce il breakdown completo con dimensioni e domini.
     */
    private Map<String, Object> buildBreakdown(DimensionScores dimensions, DomainScores domains) {
        Map<String, Object> breakdown = new HashMap<>();

        // Dimensioni
        Map<String, Object> dimensionsMap = new HashMap<>();
        if (dimensions.interests() != null) dimensionsMap.put("interests", dimensions.interests());
        if (dimensions.lifestyle() != null) dimensionsMap.put("lifestyle", dimensions.lifestyle());
        if (dimensions.values() != null) dimensionsMap.put("values", dimensions.values());
        if (dimensions.objectives() != null) dimensionsMap.put("objectives", dimensions.objectives());
        if (dimensions.psy() != null) dimensionsMap.put("psy", dimensions.psy());
        if (dimensions.astro() != null) dimensionsMap.put("astro", dimensions.astro());
        breakdown.put("dimensions", dimensionsMap);

        // Domini
        Map<String, Object> domainsMap = new HashMap<>();
        if (domains.love() != null) domainsMap.put("love", domains.love());
        if (domains.friendship() != null) domainsMap.put("friendship", domains.friendship());
        if (domains.work() != null) domainsMap.put("work", domains.work());
        if (domains.projects() != null) domainsMap.put("projects", domains.projects());
        if (domains.hobby() != null) domainsMap.put("hobby", domains.hobby());
        if (domains.growth() != null) domainsMap.put("growth", domains.growth());
        breakdown.put("domains", domainsMap);

        // Tag condivisi
        if (dimensions.sharedTags() != null && !dimensions.sharedTags().isEmpty()) {
            breakdown.put("sharedTags", dimensions.sharedTags());
        }

        // Distanza (se disponibile)
        if (dimensions.distanceKm() != null) {
            breakdown.put("distanceKm", dimensions.distanceKm());
        }

        // Informazioni sulla completezza del match
        int totalDimensions = 6;
        int availableDimensions = dimensions.availableCount();
        int completeness = (int) Math.round(100.0 * availableDimensions / totalDimensions);
        breakdown.put("completeness", completeness);
        breakdown.put("availableDimensions", availableDimensions);
        breakdown.put("totalDimensions", totalDimensions);

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

    private UserMatchResponse mapSingleResponse(UserMatchScore match, UUID userId) {
        String explanation = loadExplanations(List.of(match)).get(match.getId());
        if (explanation == null) {
            explanation = buildExplanation(match);
        }
        UUID otherUserId = resolveOtherUserId(match, userId);
        UserProfile profile = otherUserId != null
            ? userProfileRepository.findByUserId(otherUserId).orElse(null)
            : null;
        String avatarUrl = resolveAvatarUrl(otherUserId);
        String username = profile != null && profile.getUser() != null ? profile.getUser().getUsername() : null;
        UserSummaryResponse summary = userProfileMapper.toSummary(
            otherUserId,
            username,
            profile,
            avatarUrl
        );
        return userMatchMapper.toResponse(match, userId, explanation, summary);
    }

    @SuppressWarnings("unchecked")
    private String buildExplanation(UserMatchScore match) {
        if (match.getBreakdown() == null) {
            return "Match basato su compatibilita generale";
        }

        // Prova a costruire una spiegazione dal breakdown avanzato
        Object dimensionsObj = match.getBreakdown().get("dimensions");
        if (dimensionsObj instanceof Map) {
            Map<String, Object> dimensions = (Map<String, Object>) dimensionsObj;
            StringBuilder sb = new StringBuilder();

            // Trova la dimensione piu alta
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

        // Fallback: cerca sharedTags
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
}
