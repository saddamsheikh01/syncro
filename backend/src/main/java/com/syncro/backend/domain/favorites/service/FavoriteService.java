package com.syncro.backend.domain.favorites.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.ConflictException;
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
import com.syncro.backend.domain.favorites.dto.AddFavoriteRequest;
import com.syncro.backend.domain.favorites.dto.FavoriteResponse;
import com.syncro.backend.domain.favorites.dto.FavoriteType;
import com.syncro.backend.domain.favorites.entity.UserFavorite;
import com.syncro.backend.domain.favorites.mapper.FavoriteMapper;
import com.syncro.backend.domain.favorites.repository.UserFavoriteRepository;
import com.syncro.backend.domain.social.dto.PostSummaryResponse;
import com.syncro.backend.domain.social.entity.Post;
import com.syncro.backend.domain.social.repository.PostRepository;
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
public class FavoriteService {

    private final UserRepository userRepository;
    private final UserFavoriteRepository userFavoriteRepository;
    private final PlaceRepository placeRepository;
    private final ExperienceRepository experienceRepository;
    private final CategoryRepository categoryRepository;
    private final PostRepository postRepository;
    private final CategoryMapper categoryMapper;
    private final PlaceMapper placeMapper;
    private final ExperienceMapper experienceMapper;
    private final FavoriteMapper favoriteMapper;

    public FavoriteService(
        UserRepository userRepository,
        UserFavoriteRepository userFavoriteRepository,
        PlaceRepository placeRepository,
        ExperienceRepository experienceRepository,
        CategoryRepository categoryRepository,
        PostRepository postRepository,
        CategoryMapper categoryMapper,
        PlaceMapper placeMapper,
        ExperienceMapper experienceMapper,
        FavoriteMapper favoriteMapper
    ) {
        this.userRepository = userRepository;
        this.userFavoriteRepository = userFavoriteRepository;
        this.placeRepository = placeRepository;
        this.experienceRepository = experienceRepository;
        this.categoryRepository = categoryRepository;
        this.postRepository = postRepository;
        this.categoryMapper = categoryMapper;
        this.placeMapper = placeMapper;
        this.experienceMapper = experienceMapper;
        this.favoriteMapper = favoriteMapper;
    }

    @Transactional(readOnly = true)
    public Page<FavoriteResponse> getFavorites(
        UserPrincipal principal,
        String type,
        int page,
        int size
    ) {
        User user = getUser(principal);
        FavoriteType favoriteType = parseType(type);
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<UserFavorite> favorites = fetchFavorites(user.getId(), favoriteType, pageable);
        Map<UUID, PlaceSummaryResponse> places = loadPlaceSummaries(favorites.getContent());
        Map<UUID, ExperienceSummaryResponse> experiences = loadExperienceSummaries(favorites.getContent());
        Map<UUID, PostSummaryResponse> posts = loadPostSummaries(favorites.getContent());
        return favorites.map(favorite -> favoriteMapper.toResponse(
            favorite,
            favorite.getPlaceId() != null ? places.get(favorite.getPlaceId()) : null,
            favorite.getExperienceId() != null ? experiences.get(favorite.getExperienceId()) : null,
            favorite.getPostId() != null ? posts.get(favorite.getPostId()) : null
        ));
    }

    @Transactional
    public FavoriteResponse addFavorite(UserPrincipal principal, AddFavoriteRequest request) {
        User user = getUser(principal);
        UUID placeId = request.placeId();
        UUID experienceId = request.experienceId();
        UUID postId = request.postId();
        validateFavoriteTarget(placeId, experienceId, postId);

        UserFavorite favorite = new UserFavorite();
        favorite.setUser(user);

        PlaceSummaryResponse placeSummary = null;
        ExperienceSummaryResponse experienceSummary = null;
        PostSummaryResponse postSummary = null;

        if (placeId != null) {
            if (userFavoriteRepository.existsByUserIdAndPlaceId(user.getId(), placeId)) {
                throw new ConflictException("Preferito gia presente");
            }
            Place place = placeRepository.findById(placeId)
                .orElseThrow(() -> new NotFoundException("Luogo non trovato"));
            favorite.setPlace(place);
            placeSummary = mapPlaceSummary(place);
        } else if (experienceId != null) {
            if (userFavoriteRepository.existsByUserIdAndExperienceId(user.getId(), experienceId)) {
                throw new ConflictException("Preferito gia presente");
            }
            Experience experience = experienceRepository.findById(experienceId)
                .orElseThrow(() -> new NotFoundException("Esperienza non trovata"));
            favorite.setExperience(experience);
            experienceSummary = mapExperienceSummary(experience);
        } else {
            if (userFavoriteRepository.existsByUserIdAndPostId(user.getId(), postId)) {
                throw new ConflictException("Preferito gia presente");
            }
            Post post = postRepository.findById(postId)
                .orElseThrow(() -> new NotFoundException("Post non trovato"));
            favorite.setPost(post);
            postSummary = mapPostSummary(post);
        }

        UserFavorite saved = userFavoriteRepository.save(favorite);
        return favoriteMapper.toResponse(saved, placeSummary, experienceSummary, postSummary);
    }

    @Transactional
    public void removeFavorite(UserPrincipal principal, UUID placeId, UUID experienceId, UUID postId) {
        User user = getUser(principal);
        validateFavoriteTarget(placeId, experienceId, postId);

        if (placeId != null) {
            UserFavorite favorite = userFavoriteRepository.findByUserIdAndPlaceId(user.getId(), placeId)
                .orElseThrow(() -> new NotFoundException("Preferito non trovato"));
            userFavoriteRepository.delete(favorite);
            return;
        }

        if (experienceId != null) {
            UserFavorite favorite = userFavoriteRepository.findByUserIdAndExperienceId(user.getId(), experienceId)
                .orElseThrow(() -> new NotFoundException("Preferito non trovato"));
            userFavoriteRepository.delete(favorite);
            return;
        }

        UserFavorite favorite = userFavoriteRepository.findByUserIdAndPostId(user.getId(), postId)
            .orElseThrow(() -> new NotFoundException("Preferito non trovato"));
        userFavoriteRepository.delete(favorite);
    }

    private Page<UserFavorite> fetchFavorites(UUID userId, FavoriteType type, PageRequest pageable) {
        if (type == null) {
            return userFavoriteRepository.findByUserId(userId, pageable);
        }
        return switch (type) {
            case PLACE -> userFavoriteRepository.findByUserIdAndPlaceIdIsNotNull(userId, pageable);
            case EXPERIENCE -> userFavoriteRepository.findByUserIdAndExperienceIdIsNotNull(userId, pageable);
            case POST -> userFavoriteRepository.findByUserIdAndPostIdIsNotNull(userId, pageable);
        };
    }

    private Map<UUID, PlaceSummaryResponse> loadPlaceSummaries(List<UserFavorite> favorites) {
        Set<UUID> placeIds = favorites.stream()
            .map(UserFavorite::getPlaceId)
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

    private Map<UUID, ExperienceSummaryResponse> loadExperienceSummaries(List<UserFavorite> favorites) {
        Set<UUID> experienceIds = favorites.stream()
            .map(UserFavorite::getExperienceId)
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

    private PlaceSummaryResponse mapPlaceSummary(Place place) {
        CategoryResponse category = place.getCategory() != null
            ? categoryMapper.toResponse(place.getCategory())
            : null;
        return placeMapper.toSummaryResponse(place, category);
    }

    private ExperienceSummaryResponse mapExperienceSummary(Experience experience) {
        CategoryResponse category = experience.getCategory() != null
            ? categoryMapper.toResponse(experience.getCategory())
            : null;
        PlaceReferenceResponse place = experience.getPlace() != null
            ? placeMapper.toReferenceResponse(experience.getPlace())
            : null;
        return experienceMapper.toSummaryResponse(experience, category, place);
    }

    private Map<UUID, PostSummaryResponse> loadPostSummaries(List<UserFavorite> favorites) {
        Set<UUID> postIds = favorites.stream()
            .map(UserFavorite::getPostId)
            .filter(id -> id != null)
            .collect(Collectors.toSet());
        if (postIds.isEmpty()) {
            return Map.of();
        }
        return postRepository.findAllById(postIds)
            .stream()
            .collect(Collectors.toMap(Post::getId, this::mapPostSummary));
    }

    private PostSummaryResponse mapPostSummary(Post post) {
        return new PostSummaryResponse(
            post.getId(),
            post.getUserId(),
            post.getContent(),
            post.getScope() != null ? post.getScope().name() : null,
            post.getMood() != null ? post.getMood().name() : null,
            post.getTimeframe() != null ? post.getTimeframe().name() : null,
            post.getCreatedAt()
        );
    }

    private User getUser(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        UUID userId = principal.userId();
        return userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
    }

    private void validateFavoriteTarget(UUID placeId, UUID experienceId, UUID postId) {
        int count = 0;
        if (placeId != null) {
            count++;
        }
        if (experienceId != null) {
            count++;
        }
        if (postId != null) {
            count++;
        }
        if (count == 0) {
            throw new BadRequestException("Seleziona un luogo, un'esperienza o un post");
        }
        if (count > 1) {
            throw new BadRequestException("Seleziona solo un tipo di preferito");
        }
    }

    private FavoriteType parseType(String type) {
        if (type == null || type.isBlank()) {
            return null;
        }
        try {
            return FavoriteType.valueOf(type.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Tipo preferito non valido");
        }
    }
}
