package com.syncro.backend.domain.matchmaking.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.catalog.dto.CategoryResponse;
import com.syncro.backend.domain.catalog.dto.ExperienceSummaryResponse;
import com.syncro.backend.domain.catalog.dto.PlaceReferenceResponse;
import com.syncro.backend.domain.catalog.dto.PlaceSummaryResponse;
import com.syncro.backend.domain.catalog.entity.Category;
import com.syncro.backend.domain.catalog.entity.Experience;
import com.syncro.backend.domain.catalog.entity.Place;
import com.syncro.backend.domain.catalog.mapper.CategoryMapper;
import com.syncro.backend.domain.catalog.mapper.ExperienceMapper;
import com.syncro.backend.domain.catalog.mapper.PlaceMapper;
import com.syncro.backend.domain.catalog.repository.CategoryRepository;
import com.syncro.backend.domain.catalog.repository.ExperienceRepository;
import com.syncro.backend.domain.catalog.repository.PlaceRepository;
import com.syncro.backend.domain.matchmaking.dto.RecommendationResponse;
import com.syncro.backend.domain.matchmaking.dto.RecommendationType;
import com.syncro.backend.domain.matchmaking.entity.PlaceRecommendationScore;
import com.syncro.backend.domain.matchmaking.mapper.RecommendationMapper;
import com.syncro.backend.domain.matchmaking.repository.ExperienceCandidateProjection;
import com.syncro.backend.domain.matchmaking.repository.PlaceCandidateProjection;
import com.syncro.backend.domain.matchmaking.repository.PlaceRecommendationScoreRepository;
import com.syncro.backend.domain.tags.entity.UserInterest;
import com.syncro.backend.domain.tags.repository.UserInterestRepository;
import com.syncro.backend.security.UserPrincipal;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecommendationService {

    private static final int SCORE_MULTIPLIER = 10;
    private static final int MIN_CANDIDATES = 20;

    private final UserRepository userRepository;
    private final UserInterestRepository userInterestRepository;
    private final PlaceRecommendationScoreRepository recommendationRepository;
    private final PlaceRepository placeRepository;
    private final ExperienceRepository experienceRepository;
    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;
    private final PlaceMapper placeMapper;
    private final ExperienceMapper experienceMapper;
    private final RecommendationMapper recommendationMapper;

    public RecommendationService(
        UserRepository userRepository,
        UserInterestRepository userInterestRepository,
        PlaceRecommendationScoreRepository recommendationRepository,
        PlaceRepository placeRepository,
        ExperienceRepository experienceRepository,
        CategoryRepository categoryRepository,
        CategoryMapper categoryMapper,
        PlaceMapper placeMapper,
        ExperienceMapper experienceMapper,
        RecommendationMapper recommendationMapper
    ) {
        this.userRepository = userRepository;
        this.userInterestRepository = userInterestRepository;
        this.recommendationRepository = recommendationRepository;
        this.placeRepository = placeRepository;
        this.experienceRepository = experienceRepository;
        this.categoryRepository = categoryRepository;
        this.categoryMapper = categoryMapper;
        this.placeMapper = placeMapper;
        this.experienceMapper = experienceMapper;
        this.recommendationMapper = recommendationMapper;
    }

    @Transactional
    public Page<RecommendationResponse> getRecommendations(
        UserPrincipal principal,
        String type,
        boolean refresh,
        int page,
        int size
    ) {
        User user = getUser(principal);
        RecommendationType recommendationType = parseType(type);
        PageRequest pageable = PageRequest.of(
            page,
            size,
            Sort.by(Sort.Order.desc("score"), Sort.Order.desc("createdAt"))
        );
        Page<PlaceRecommendationScore> existing = fetchRecommendations(user.getId(), recommendationType, pageable);
        if (refresh || existing.isEmpty()) {
            computeRecommendations(user, page, size);
            existing = fetchRecommendations(user.getId(), recommendationType, pageable);
        }
        return mapResponses(existing);
    }

    private void computeRecommendations(User user, int page, int size) {
        List<UUID> tagIds = userInterestRepository.findAllByUserId(user.getId())
            .stream()
            .map(UserInterest::getTagId)
            .toList();
        if (tagIds.isEmpty()) {
            return;
        }
        int limit = Math.max(MIN_CANDIDATES, (page + 1) * size);
        List<PlaceCandidateProjection> placeCandidates = recommendationRepository.findPlaceCandidates(tagIds, limit);
        for (PlaceCandidateProjection candidate : placeCandidates) {
            upsertPlaceScore(user.getId(), candidate.getPlaceId(), candidate.getSharedCount());
        }
        List<ExperienceCandidateProjection> experienceCandidates = recommendationRepository.findExperienceCandidates(tagIds, limit);
        for (ExperienceCandidateProjection candidate : experienceCandidates) {
            upsertExperienceScore(user.getId(), candidate.getExperienceId(), candidate.getSharedCount());
        }
    }

    private void upsertPlaceScore(UUID userId, UUID placeId, int sharedCount) {
        if (sharedCount <= 0) {
            return;
        }
        PlaceRecommendationScore score = recommendationRepository.findByUserIdAndPlaceId(userId, placeId)
            .orElseGet(PlaceRecommendationScore::new);
        score.setUserId(userId);
        score.setPlaceId(placeId);
        score.setExperienceId(null);
        score.setScore(sharedCount * SCORE_MULTIPLIER);
        score.setBreakdown(Map.of("sharedTags", sharedCount));
        recommendationRepository.save(score);
    }

    private void upsertExperienceScore(UUID userId, UUID experienceId, int sharedCount) {
        if (sharedCount <= 0) {
            return;
        }
        PlaceRecommendationScore score = recommendationRepository.findByUserIdAndExperienceId(userId, experienceId)
            .orElseGet(PlaceRecommendationScore::new);
        score.setUserId(userId);
        score.setExperienceId(experienceId);
        score.setPlaceId(null);
        score.setScore(sharedCount * SCORE_MULTIPLIER);
        score.setBreakdown(Map.of("sharedTags", sharedCount));
        recommendationRepository.save(score);
    }

    private Page<PlaceRecommendationScore> fetchRecommendations(
        UUID userId,
        RecommendationType recommendationType,
        PageRequest pageable
    ) {
        if (recommendationType == null) {
            return recommendationRepository.findByUserId(userId, pageable);
        }
        return switch (recommendationType) {
            case PLACE -> recommendationRepository.findByUserIdAndPlaceIdIsNotNull(userId, pageable);
            case EXPERIENCE -> recommendationRepository.findByUserIdAndExperienceIdIsNotNull(userId, pageable);
        };
    }

    private Page<RecommendationResponse> mapResponses(Page<PlaceRecommendationScore> scores) {
        Map<UUID, PlaceSummaryResponse> places = loadPlaceSummaries(scores.getContent());
        Map<UUID, ExperienceSummaryResponse> experiences = loadExperienceSummaries(scores.getContent());
        return scores.map(score -> recommendationMapper.toResponse(
            score,
            score.getPlaceId() != null ? places.get(score.getPlaceId()) : null,
            score.getExperienceId() != null ? experiences.get(score.getExperienceId()) : null
        ));
    }

    private Map<UUID, PlaceSummaryResponse> loadPlaceSummaries(List<PlaceRecommendationScore> scores) {
        Set<UUID> placeIds = scores.stream()
            .map(PlaceRecommendationScore::getPlaceId)
            .filter(id -> id != null)
            .collect(Collectors.toSet());
        if (placeIds.isEmpty()) {
            return Map.of();
        }
        List<Place> places = placeRepository.findAllById(placeIds);
        Map<UUID, CategoryResponse> categories = loadCategories(places.stream()
            .map(Place::getCategory)
            .filter(category -> category != null)
            .map(Category::getId)
            .collect(Collectors.toSet()));
        return places.stream()
            .collect(Collectors.toMap(
                Place::getId,
                place -> placeMapper.toSummaryResponse(place, mapCategory(categories, place.getCategory()))
            ));
    }

    private Map<UUID, ExperienceSummaryResponse> loadExperienceSummaries(List<PlaceRecommendationScore> scores) {
        Set<UUID> experienceIds = scores.stream()
            .map(PlaceRecommendationScore::getExperienceId)
            .filter(id -> id != null)
            .collect(Collectors.toSet());
        if (experienceIds.isEmpty()) {
            return Map.of();
        }
        List<Experience> experiences = experienceRepository.findAllById(experienceIds);
        Map<UUID, CategoryResponse> categories = loadCategories(experiences.stream()
            .map(Experience::getCategory)
            .filter(category -> category != null)
            .map(Category::getId)
            .collect(Collectors.toSet()));
        Map<UUID, PlaceReferenceResponse> places = loadPlaceReferences(experiences);
        return experiences.stream()
            .collect(Collectors.toMap(
                Experience::getId,
                experience -> experienceMapper.toSummaryResponse(
                    experience,
                    mapCategory(categories, experience.getCategory()),
                    mapPlaceReference(places, experience.getPlace())
                )
            ));
    }

    private Map<UUID, CategoryResponse> loadCategories(Set<UUID> categoryIds) {
        if (categoryIds.isEmpty()) {
            return Map.of();
        }
        return categoryRepository.findAllById(categoryIds)
            .stream()
            .map(categoryMapper::toResponse)
            .collect(Collectors.toMap(CategoryResponse::id, Function.identity()));
    }

    private Map<UUID, PlaceReferenceResponse> loadPlaceReferences(List<Experience> experiences) {
        Set<UUID> placeIds = experiences.stream()
            .map(Experience::getPlace)
            .filter(place -> place != null)
            .map(Place::getId)
            .collect(Collectors.toSet());
        if (placeIds.isEmpty()) {
            return Map.of();
        }
        return placeRepository.findAllById(placeIds)
            .stream()
            .map(placeMapper::toReferenceResponse)
            .collect(Collectors.toMap(PlaceReferenceResponse::id, Function.identity()));
    }

    private CategoryResponse mapCategory(Map<UUID, CategoryResponse> categories, Category category) {
        if (category == null) {
            return null;
        }
        return categories.get(category.getId());
    }

    private PlaceReferenceResponse mapPlaceReference(
        Map<UUID, PlaceReferenceResponse> places,
        Place place
    ) {
        if (place == null) {
            return null;
        }
        return places.get(place.getId());
    }

    private User getUser(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        UUID userId = principal.userId();
        return userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
    }

    private RecommendationType parseType(String type) {
        if (type == null || type.isBlank()) {
            return null;
        }
        try {
            return RecommendationType.valueOf(type.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Tipo raccomandazione non valido");
        }
    }
}
