package com.syncro.backend.domain.social.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.ConflictException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.profile.entity.ProfileVisibility;
import com.syncro.backend.domain.profile.entity.UserProfile;
import com.syncro.backend.domain.profile.repository.UserProfileRepository;
import com.syncro.backend.domain.social.dto.CreatePostRequest;
import com.syncro.backend.domain.social.dto.PostResponse;
import com.syncro.backend.domain.social.entity.Post;
import com.syncro.backend.domain.social.entity.PostLike;
import com.syncro.backend.domain.social.mapper.PostMapper;
import com.syncro.backend.domain.social.repository.PostCommentCountProjection;
import com.syncro.backend.domain.social.repository.PostCommentRepository;
import com.syncro.backend.domain.social.repository.PostLikeCountProjection;
import com.syncro.backend.domain.social.repository.PostLikeRepository;
import com.syncro.backend.domain.social.repository.PostRepository;
import com.syncro.backend.security.UserPrincipal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
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
    private final PostMapper postMapper;

    public PostService(
        UserRepository userRepository,
        UserProfileRepository userProfileRepository,
        PostRepository postRepository,
        PostLikeRepository postLikeRepository,
        PostCommentRepository postCommentRepository,
        PostMapper postMapper
    ) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.postRepository = postRepository;
        this.postLikeRepository = postLikeRepository;
        this.postCommentRepository = postCommentRepository;
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

        Post saved = postRepository.save(post);
        return postMapper.toResponse(saved, 0, 0, false);
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> getFeed(
        UserPrincipal principal,
        Double latitude,
        Double longitude,
        Double radiusKm,
        int page,
        int size
    ) {
        User user = getUser(principal);
        validateCoordinates(latitude, longitude);
        validateRadius(radiusKm, latitude, longitude);

        PageRequest pageable = PageRequest.of(page, size);
        Page<Post> posts = postRepository.findFeed(latitude, longitude, radiusKm, pageable);
        return mapFeed(posts, user.getId());
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
        return mapFeed(posts, user.getId());
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
        return mapFeed(posts, user.getId());
    }

    @Transactional
    public void likePost(UserPrincipal principal, UUID postId) {
        User user = getUser(principal);
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new NotFoundException("Post non trovato"));
        if (postLikeRepository.existsByUserIdAndPostId(user.getId(), postId)) {
            throw new ConflictException("Post gia piaciuto");
        }
        PostLike like = new PostLike();
        like.setUser(user);
        like.setPost(post);
        postLikeRepository.save(like);
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

    private Page<PostResponse> mapFeed(Page<Post> posts, UUID userId) {
        if (posts.isEmpty()) {
            return posts.map(post -> postMapper.toResponse(post, 0, 0, false));
        }
        List<UUID> postIds = posts.getContent().stream().map(Post::getId).toList();
        Map<UUID, Long> likeCounts = loadLikeCounts(postIds);
        Map<UUID, Long> commentCounts = loadCommentCounts(postIds);
        Set<UUID> likedByUser = loadLikedByUser(userId, postIds);
        return posts.map(post -> postMapper.toResponse(
            post,
            likeCounts.getOrDefault(post.getId(), 0L),
            commentCounts.getOrDefault(post.getId(), 0L),
            likedByUser.contains(post.getId())
        ));
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

    private User getUser(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        UUID userId = principal.userId();
        return userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
    }
}
