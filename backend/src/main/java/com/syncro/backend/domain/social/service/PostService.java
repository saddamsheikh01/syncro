package com.syncro.backend.domain.social.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.ConflictException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.profile.entity.ProfileVisibility;
import com.syncro.backend.domain.profile.entity.Gender;
import com.syncro.backend.domain.profile.entity.UserProfile;
import com.syncro.backend.domain.profile.repository.UserProfileRepository;
import com.syncro.backend.domain.media.entity.MediaObject;
import com.syncro.backend.domain.media.entity.MediaOwnerType;
import com.syncro.backend.domain.media.repository.MediaObjectRepository;
import com.syncro.backend.domain.social.dto.CreatePostRequest;
import com.syncro.backend.domain.social.dto.PostResponse;
import com.syncro.backend.domain.social.dto.TaggedUserResponse;
import com.syncro.backend.domain.social.entity.Post;
import com.syncro.backend.domain.social.entity.PostLike;
import com.syncro.backend.domain.social.entity.PostLikeId;
import com.syncro.backend.domain.social.entity.PostMood;
import com.syncro.backend.domain.social.entity.PostReactionType;
import com.syncro.backend.domain.social.entity.PostScope;
import com.syncro.backend.domain.social.entity.PostTaggedUser;
import com.syncro.backend.domain.social.entity.PostTimeframe;
import com.syncro.backend.domain.social.repository.PostReactionCountProjection;
import com.syncro.backend.domain.social.repository.PostTaggedUserRepository;
import com.syncro.backend.domain.social.repository.PostUserReactionProjection;
import com.syncro.backend.domain.tests.entity.UserPsyProfile;
import com.syncro.backend.domain.tests.repository.UserPsyProfileRepository;
import com.syncro.backend.domain.favorites.repository.UserFavoriteRepository;
import com.syncro.backend.domain.matchmaking.dto.DimensionScores;
import com.syncro.backend.domain.matchmaking.service.DimensionScoreCalculator;
import com.syncro.backend.domain.social.mapper.PostMapper;
import com.syncro.backend.domain.social.repository.PostCommentCountProjection;
import com.syncro.backend.domain.social.repository.PostCommentRepository;
import com.syncro.backend.domain.social.repository.PostLikeCountProjection;
import com.syncro.backend.domain.social.repository.PostLikeRepository;
import com.syncro.backend.domain.social.repository.PostRepository;
import com.syncro.backend.security.UserPrincipal;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PostService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final PostCommentRepository postCommentRepository;
    private final PostTaggedUserRepository postTaggedUserRepository;
    private final UserFavoriteRepository userFavoriteRepository;
    private final UserPsyProfileRepository userPsyProfileRepository;
    private final DimensionScoreCalculator dimensionScoreCalculator;
    private final MediaObjectRepository mediaObjectRepository;
    private final PostMapper postMapper;

    public PostService(
        UserRepository userRepository,
        UserProfileRepository userProfileRepository,
        PostRepository postRepository,
        PostLikeRepository postLikeRepository,
        PostCommentRepository postCommentRepository,
        PostTaggedUserRepository postTaggedUserRepository,
        UserFavoriteRepository userFavoriteRepository,
        UserPsyProfileRepository userPsyProfileRepository,
        DimensionScoreCalculator dimensionScoreCalculator,
        MediaObjectRepository mediaObjectRepository,
        PostMapper postMapper
    ) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.postRepository = postRepository;
        this.postLikeRepository = postLikeRepository;
        this.postCommentRepository = postCommentRepository;
        this.postTaggedUserRepository = postTaggedUserRepository;
        this.userFavoriteRepository = userFavoriteRepository;
        this.userPsyProfileRepository = userPsyProfileRepository;
        this.dimensionScoreCalculator = dimensionScoreCalculator;
        this.mediaObjectRepository = mediaObjectRepository;
        this.postMapper = postMapper;
    }

    @Transactional
    public PostResponse createPost(UserPrincipal principal, CreatePostRequest request) {
        User user = getUser(principal);
        validateCoordinates(request.latitude(), request.longitude());

        Post post = new Post();
        post.setUser(user);
        post.setContent(normalizeRequired(request.content()));
        post.setLanguage(normalizeOptional(request.language(), user.getLanguage()));
        post.setLatitude(request.latitude());
        post.setLongitude(request.longitude());
        post.setScope(request.scope());
        post.setMood(request.mood());
        post.setTimeframe(request.timeframe());

        Post saved = postRepository.save(post);
        List<UUID> taggedUserIds = normalizeTaggedUserIds(request.taggedUserIds(), user.getId());
        if (!taggedUserIds.isEmpty()) {
            validateTaggedUsers(taggedUserIds);
            List<PostTaggedUser> taggedUsers = taggedUserIds.stream()
                .map(taggedUserId -> {
                    PostTaggedUser taggedUser = new PostTaggedUser();
                    taggedUser.setPost(saved);
                    taggedUser.setUserId(taggedUserId);
                    return taggedUser;
                })
                .toList();
            postTaggedUserRepository.saveAll(taggedUsers);
        }

        updatePassiveProfile(user.getId(), saved);

        return postMapper.toResponse(
            saved,
            0,
            0,
            false,
            Map.of(),
            null,
            false,
            null,
            List.of()
        );
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> getFeed(
        UserPrincipal principal,
        Double latitude,
        Double longitude,
        Double radiusKm,
        PostScope scope,
        PostMood mood,
        PostTimeframe timeframe,
        String city,
        Integer minAge,
        Integer maxAge,
        Gender gender,
        Integer minCompatibility,
        int page,
        int size
    ) {
        User user = getUser(principal);
        validateCoordinates(latitude, longitude);
        validateRadius(radiusKm, latitude, longitude);

        PageRequest pageable = PageRequest.of(page, size);
        Page<Post> posts = postRepository.findFeed(
            latitude,
            longitude,
            radiusKm,
            scope != null ? scope.name() : null,
            mood != null ? mood.name() : null,
            timeframe != null ? timeframe.name() : null,
            normalizeFilter(city),
            gender != null ? gender.name() : null,
            minAge,
            maxAge,
            pageable
        );
        return mapFeed(posts, user.getId(), latitude, longitude, radiusKm, minCompatibility);
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> searchPosts(
        UserPrincipal principal,
        String query,
        int page,
        int size
    ) {
        User user = getUser(principal);
        if (query == null || query.trim().length() < 2) {
            throw new BadRequestException("Query deve avere almeno 2 caratteri");
        }
        PageRequest pageable = PageRequest.of(page, size);
        Page<Post> posts = postRepository.searchByContent(query.trim(), pageable);
        return mapFeed(posts, user.getId(), null, null, null, null);
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> getUserPosts(
        UserPrincipal principal,
        UUID targetUserId,
        int page,
        int size
    ) {
        User user = getUser(principal);
        if (targetUserId == null) {
            throw new NotFoundException("Utente non valido");
        }
        userRepository.findById(targetUserId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
        ensureProfilePublic(targetUserId);

        PageRequest pageable = PageRequest.of(page, size);
        Page<Post> posts = postRepository.findByUserIdOrderByCreatedAtDesc(targetUserId, pageable);
        return mapFeed(posts, user.getId(), null, null, null, null);
    }

    @Transactional
    public void likePost(UserPrincipal principal, UUID postId) {
        User user = getUser(principal);
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new NotFoundException("Post non trovato"));
        PostLike existing = postLikeRepository.findById(new PostLikeId(user.getId(), postId))
            .orElse(null);
        if (existing != null) {
            if (existing.getReaction() == PostReactionType.LIKE) {
                throw new ConflictException("Post gia piaciuto");
            }
            existing.setReaction(PostReactionType.LIKE);
            postLikeRepository.save(existing);
            return;
        }
        PostLike like = new PostLike();
        like.setUser(user);
        like.setPost(post);
        like.setReaction(PostReactionType.LIKE);
        postLikeRepository.save(like);
    }

    @Transactional
    public void reactToPost(UserPrincipal principal, UUID postId, PostReactionType reaction) {
        User user = getUser(principal);
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new NotFoundException("Post non trovato"));

        PostLike existing = postLikeRepository.findById(new PostLikeId(
            user.getId(),
            post.getId()
        )).orElse(null);

        if (existing == null) {
            PostLike created = new PostLike();
            created.setUser(user);
            created.setPost(post);
            created.setReaction(reaction);
            postLikeRepository.save(created);
            return;
        }

        if (existing.getReaction() == reaction) {
            throw new ConflictException("Reazione gia presente");
        }

        existing.setReaction(reaction);
        postLikeRepository.save(existing);
    }

    @Transactional
    public void unlikePost(UserPrincipal principal, UUID postId) {
        User user = getUser(principal);
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new NotFoundException("Post non trovato"));
        if (!postLikeRepository.existsByUserIdAndPostId(user.getId(), postId)) {
            throw new NotFoundException("Like non trovato");
        }
        postLikeRepository.deleteByUserIdAndPostId(user.getId(), postId);
    }

    private Page<PostResponse> mapFeed(
        Page<Post> posts,
        UUID userId,
        Double latitude,
        Double longitude,
        Double radiusKm,
        Integer minCompatibility
    ) {
        if (posts.isEmpty()) {
            return posts.map(post -> postMapper.toResponse(
                post,
                0,
                0,
                false,
                Map.of(),
                null,
                false,
                null,
                List.of()
            ));
        }

        List<UUID> postIds = posts.getContent().stream().map(Post::getId).toList();
        Map<UUID, Long> likeCounts = loadLikeCounts(postIds);
        Map<UUID, Long> commentCounts = loadCommentCounts(postIds);
        Set<UUID> likedByUser = loadLikedByUser(userId, postIds);
        Map<UUID, Map<String, Long>> reactionCounts = loadReactionCounts(postIds);
        Map<UUID, String> userReactions = loadUserReactions(userId, postIds);
        Set<UUID> favoritedPosts = loadFavoritedPosts(userId, postIds);
        Map<UUID, List<TaggedUserResponse>> taggedUsers = loadTaggedUsers(postIds);
        Map<UUID, Integer> matchScores = calculateMatchScores(userId, posts.getContent());

        List<Post> filteredPosts = posts.getContent().stream()
            .filter(post -> {
                if (minCompatibility == null) {
                    return true;
                }
                Integer score = matchScores.get(post.getId());
                return score != null && score >= minCompatibility;
            })
            .sorted((a, b) -> {
                int scoreA = calculateVisibilityScore(matchScores.get(a.getId()), latitude, longitude, radiusKm, a);
                int scoreB = calculateVisibilityScore(matchScores.get(b.getId()), latitude, longitude, radiusKm, b);
                int cmp = Integer.compare(scoreB, scoreA);
                if (cmp != 0) {
                    return cmp;
                }
                return b.getCreatedAt().compareTo(a.getCreatedAt());
            })
            .toList();

        List<PostResponse> responses = filteredPosts.stream()
            .map(post -> postMapper.toResponse(
                post,
                likeCounts.getOrDefault(post.getId(), 0L),
                commentCounts.getOrDefault(post.getId(), 0L),
                likedByUser.contains(post.getId()),
                reactionCounts.getOrDefault(post.getId(), Map.of()),
                userReactions.get(post.getId()),
                favoritedPosts.contains(post.getId()),
                matchScores.get(post.getId()),
                taggedUsers.getOrDefault(post.getId(), List.of())
            ))
            .toList();

        long totalElements = minCompatibility == null ? posts.getTotalElements() : responses.size();
        return new PageImpl<>(responses, posts.getPageable(), totalElements);
    }

    private Map<UUID, Long> loadLikeCounts(List<UUID> postIds) {
        List<PostLikeCountProjection> counts = postLikeRepository.countByPostIds(postIds);
        Map<UUID, Long> map = new HashMap<>();
        for (PostLikeCountProjection item : counts) {
            map.put(item.getPostId(), item.getLikeCount());
        }
        return map;
    }

    private Map<UUID, Long> loadCommentCounts(List<UUID> postIds) {
        List<PostCommentCountProjection> counts = postCommentRepository.countByPostIds(postIds);
        Map<UUID, Long> map = new HashMap<>();
        for (PostCommentCountProjection item : counts) {
            map.put(item.getPostId(), item.getCommentCount());
        }
        return map;
    }

    private Set<UUID> loadLikedByUser(UUID userId, List<UUID> postIds) {
        return postLikeRepository.findLikedPostIds(userId, postIds)
            .stream()
            .collect(Collectors.toSet());
    }

    private Map<UUID, Map<String, Long>> loadReactionCounts(List<UUID> postIds) {
        List<PostReactionCountProjection> counts = postLikeRepository.countReactionsByPostIds(postIds);
        Map<UUID, Map<String, Long>> map = new HashMap<>();
        for (PostReactionCountProjection item : counts) {
            map.computeIfAbsent(item.getPostId(), key -> new HashMap<>())
                .put(item.getReaction(), item.getReactionCount());
        }
        return map;
    }

    private Map<UUID, String> loadUserReactions(UUID userId, List<UUID> postIds) {
        List<PostUserReactionProjection> reactions = postLikeRepository.findUserReactions(userId, postIds);
        Map<UUID, String> map = new HashMap<>();
        for (PostUserReactionProjection reaction : reactions) {
            map.put(reaction.getPostId(), reaction.getReaction());
        }
        return map;
    }

    private Set<UUID> loadFavoritedPosts(UUID userId, List<UUID> postIds) {
        return userFavoriteRepository.findPostIdsByUserIdAndPostIdIn(userId, postIds)
            .stream()
            .collect(Collectors.toSet());
    }

    private Map<UUID, List<TaggedUserResponse>> loadTaggedUsers(List<UUID> postIds) {
        Map<UUID, List<TaggedUserResponse>> result = new HashMap<>();
        List<PostTaggedUser> taggedUsers = postTaggedUserRepository.findByPostIds(postIds);
        if (taggedUsers.isEmpty()) {
            return result;
        }

        Map<UUID, List<UUID>> postToUserIds = new HashMap<>();
        Set<UUID> userIds = new java.util.HashSet<>();
        for (PostTaggedUser taggedUser : taggedUsers) {
            postToUserIds.computeIfAbsent(taggedUser.getPostId(), key -> new ArrayList<>())
                .add(taggedUser.getUserId());
            userIds.add(taggedUser.getUserId());
        }

        Map<UUID, TaggedUserResponse> userResponses = buildTaggedUsers(userIds.stream().toList());
        for (Map.Entry<UUID, List<UUID>> entry : postToUserIds.entrySet()) {
            List<TaggedUserResponse> responses = entry.getValue().stream()
                .map(userResponses::get)
                .filter(item -> item != null)
                .toList();
            result.put(entry.getKey(), responses);
        }
        return result;
    }

    private Map<UUID, TaggedUserResponse> buildTaggedUsers(List<UUID> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Map.of();
        }
        List<User> users = userRepository.findAllById(userIds);
        Map<UUID, User> usersById = users.stream()
            .collect(Collectors.toMap(User::getId, user -> user));
        Map<UUID, UserProfile> profilesByUserId = userProfileRepository.findByUserIdIn(userIds).stream()
            .filter(profile -> profile.getUser() != null)
            .collect(Collectors.toMap(profile -> profile.getUser().getId(), profile -> profile));
        Map<UUID, String> avatarUrls = resolveAvatarUrls(userIds);

        Map<UUID, TaggedUserResponse> result = new HashMap<>();
        for (UUID userId : userIds) {
            User user = usersById.get(userId);
            if (user == null) {
                continue;
            }
            UserProfile profile = profilesByUserId.get(userId);
            result.put(userId, new TaggedUserResponse(
                userId,
                user.getUsername(),
                profile != null ? profile.getFullName() : null,
                avatarUrls.get(userId)
            ));
        }
        return result;
    }

    private Map<UUID, Integer> calculateMatchScores(UUID viewerId, List<Post> posts) {
        Map<UUID, Integer> scores = new HashMap<>();
        for (Post post : posts) {
            if (post.getUserId() == null) {
                continue;
            }
            Integer score = calculateCompatibilityScore(viewerId, post.getUserId());
            scores.put(post.getId(), score);
        }
        return scores;
    }

    private Integer calculateCompatibilityScore(UUID viewerId, UUID authorId) {
        if (viewerId == null || authorId == null) {
            return null;
        }
        if (viewerId.equals(authorId)) {
            return 100;
        }
        DimensionScores dimensions = dimensionScoreCalculator.calculate(viewerId, authorId);
        if (dimensions == null) {
            return null;
        }
        int weight = 0;
        int sum = 0;
        if (dimensions.interests() != null) {
            sum += dimensions.interests() * 2;
            weight += 2;
        }
        if (dimensions.lifestyle() != null) {
            sum += dimensions.lifestyle();
            weight += 1;
        }
        if (dimensions.values() != null) {
            sum += dimensions.values();
            weight += 1;
        }
        if (dimensions.objectives() != null) {
            sum += dimensions.objectives();
            weight += 1;
        }
        if (dimensions.psy() != null) {
            sum += dimensions.psy();
            weight += 1;
        }
        if (dimensions.astro() != null) {
            sum += dimensions.astro();
            weight += 1;
        }
        if (weight == 0) {
            return null;
        }
        return Math.min(100, Math.max(0, (int) Math.round((double) sum / weight)));
    }

    private int calculateVisibilityScore(
        Integer matchScore,
        Double latitude,
        Double longitude,
        Double radiusKm,
        Post post
    ) {
        double score = matchScore != null ? matchScore : 0;
        score += calculateRecencyBonus(post);
        score += calculateDistanceBonus(latitude, longitude, radiusKm, post);
        return (int) Math.round(Math.max(0, Math.min(100, score)));
    }

    private double calculateRecencyBonus(Post post) {
        if (post.getCreatedAt() == null) {
            return 0;
        }
        long hours = java.time.Duration.between(post.getCreatedAt(), java.time.Instant.now()).toHours();
        if (hours <= 0) {
            return 10;
        }
        double ratio = Math.min(1.0, hours / 24.0);
        return 10 * (1 - ratio);
    }

    private double calculateDistanceBonus(
        Double latitude,
        Double longitude,
        Double radiusKm,
        Post post
    ) {
        if (latitude == null || longitude == null || radiusKm == null) {
            return 0;
        }
        if (post.getLatitude() == null || post.getLongitude() == null) {
            return 0;
        }
        Double distanceKm = calculateDistanceKm(
            latitude,
            longitude,
            post.getLatitude(),
            post.getLongitude()
        );
        if (distanceKm == null || radiusKm <= 0) {
            return 0;
        }
        double ratio = Math.min(1.0, distanceKm / radiusKm);
        return 10 * (1 - ratio);
    }

    private Double calculateDistanceKm(double lat1, double lng1, double lat2, double lng2) {
        double earthRadius = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
            * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadius * c;
    }

    private List<UUID> normalizeTaggedUserIds(List<UUID> taggedUserIds, UUID authorId) {
        if (taggedUserIds == null || taggedUserIds.isEmpty()) {
            return List.of();
        }
        return taggedUserIds.stream()
            .filter(id -> id != null && (authorId == null || !authorId.equals(id)))
            .distinct()
            .limit(10)
            .toList();
    }

    private void validateTaggedUsers(List<UUID> taggedUserIds) {
        if (taggedUserIds == null || taggedUserIds.isEmpty()) {
            return;
        }
        List<User> users = userRepository.findAllById(taggedUserIds);
        if (users.size() != taggedUserIds.size()) {
            throw new NotFoundException("Uno o piu utenti taggati non sono validi");
        }
    }

    @SuppressWarnings("unchecked")
    private void updatePassiveProfile(UUID userId, Post post) {
        if (userId == null || post == null) {
            return;
        }
        UserPsyProfile profile = userPsyProfileRepository.findByUserId(userId)
            .orElseGet(() -> {
                UserPsyProfile created = new UserPsyProfile();
                userRepository.findById(userId).ifPresent(user -> {
                    created.setUser(user);
                    created.setUserId(user.getId());
                });
                return created;
            });
        if (profile.getUser() == null) {
            userRepository.findById(userId).ifPresent(user -> {
                profile.setUser(user);
                profile.setUserId(user.getId());
            });
        }

        Map<String, Object> profileData = Optional.ofNullable(profile.getProfile())
            .orElseGet(HashMap::new);
        Map<String, Object> passive = (Map<String, Object>) profileData
            .computeIfAbsent("passive", key -> new HashMap<>());
        Map<String, Object> feed = (Map<String, Object>) passive
            .computeIfAbsent("feed", key -> new HashMap<>());

        incrementCounter((Map<String, Object>) feed.computeIfAbsent("interests", key -> new HashMap<>()),
            post.getScope() != null ? post.getScope().name() : null);
        incrementCounter((Map<String, Object>) feed.computeIfAbsent("lifestyle", key -> new HashMap<>()),
            post.getMood() != null ? post.getMood().name() : null);
        incrementCounter((Map<String, Object>) feed.computeIfAbsent("objectives", key -> new HashMap<>()),
            post.getTimeframe() != null ? post.getTimeframe().name() : null);

        int signals = ((Number) feed.getOrDefault("signals", 0)).intValue() + 1;
        feed.put("signals", signals);
        int reliability = Math.min(100, 20 + signals * 5);
        feed.put("reliability", reliability);
        feed.put("updatedAt", java.time.Instant.now().toString());

        profileData.put("passive", passive);
        profile.setProfile(profileData);
        userPsyProfileRepository.save(profile);
    }

    private void incrementCounter(Map<String, Object> target, String key) {
        if (key == null) {
            return;
        }
        int value = ((Number) target.getOrDefault(key, 0)).intValue();
        target.put(key, value + 1);
    }

    private Map<UUID, String> resolveAvatarUrls(List<UUID> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Map.of();
        }
        List<MediaObject> media = mediaObjectRepository
            .findByOwnerTypeAndOwnerIdIn(MediaOwnerType.USER_PROFILE, userIds);
        Map<UUID, String> result = new HashMap<>();
        media.stream()
            .sorted(Comparator.comparing(MediaObject::getCreatedAt).reversed())
            .forEach(item -> result.putIfAbsent(item.getOwnerId(), item.getUrl()));
        return result;
    }

    private void validateCoordinates(Double latitude, Double longitude) {
        if ((latitude == null) != (longitude == null)) {
            throw new BadRequestException("Latitudine e longitudine devono essere valorizzate insieme");
        }
    }

    private void validateRadius(Double radiusKm, Double latitude, Double longitude) {
        if (radiusKm != null && (latitude == null || longitude == null)) {
            throw new BadRequestException("Raggio richiede coordinate valide");
        }
        if (radiusKm != null && radiusKm <= 0) {
            throw new BadRequestException("Raggio non valido");
        }
    }

    private void ensureProfilePublic(UUID userId) {
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        if (profile == null) {
            throw new NotFoundException("Profilo non disponibile");
        }
        if (profile.getVisibility() == ProfileVisibility.PRIVATE) {
            throw new NotFoundException("Profilo privato. L'utente non rende visibili i dettagli.");
        }
    }

    private String normalizeRequired(String value) {
        if (value == null) {
            throw new BadRequestException("Contenuto non valido");
        }
        String normalized = value.trim();
        if (normalized.isBlank()) {
            throw new BadRequestException("Contenuto non valido");
        }
        return normalized;
    }

    private String normalizeOptional(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback != null ? fallback : "it";
        }
        return value.trim();
    }

    private String normalizeFilter(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
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
