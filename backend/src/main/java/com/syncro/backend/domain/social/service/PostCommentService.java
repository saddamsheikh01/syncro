package com.syncro.backend.domain.social.service;

import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.media.entity.MediaOwnerType;
import com.syncro.backend.domain.media.repository.MediaObjectRepository;
import com.syncro.backend.domain.email.service.EmailNotificationService;
import com.syncro.backend.domain.notifications.service.NotificationService;
import com.syncro.backend.domain.profile.entity.UserProfile;
import com.syncro.backend.domain.profile.repository.UserProfileRepository;
import com.syncro.backend.domain.social.dto.CommentResponse;
import com.syncro.backend.domain.social.dto.CreateCommentRequest;
import com.syncro.backend.domain.social.entity.Post;
import com.syncro.backend.domain.social.entity.PostComment;
import com.syncro.backend.domain.social.mapper.PostCommentMapper;
import com.syncro.backend.domain.social.repository.PostCommentRepository;
import com.syncro.backend.domain.social.repository.PostRepository;
import com.syncro.backend.security.UserPrincipal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PostCommentService {

    private final PostCommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final MediaObjectRepository mediaObjectRepository;
    private final PostCommentMapper commentMapper;
    private final NotificationService notificationService;
    private final EmailNotificationService emailNotificationService;

    public PostCommentService(
        PostCommentRepository commentRepository,
        PostRepository postRepository,
        UserRepository userRepository,
        UserProfileRepository profileRepository,
        MediaObjectRepository mediaObjectRepository,
        PostCommentMapper commentMapper,
        NotificationService notificationService,
        EmailNotificationService emailNotificationService
    ) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.mediaObjectRepository = mediaObjectRepository;
        this.commentMapper = commentMapper;
        this.notificationService = notificationService;
        this.emailNotificationService = emailNotificationService;
    }

    @Transactional
    public CommentResponse createComment(UserPrincipal principal, UUID postId, CreateCommentRequest request) {
        User user = getUser(principal);
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new NotFoundException("Post non trovato"));

        PostComment comment = new PostComment();
        comment.setPost(post);
        comment.setUser(user);
        comment.setContent(request.content().trim());

        PostComment saved = commentRepository.save(comment);
        notificationService.createPostCommentNotification(
            post.getUserId(),
            user.getId(),
            user.getUsername(),
            post.getId(),
            saved.getId(),
            saved.getContent()
        );
        if (!post.getUserId().equals(user.getId())) {
            try {
                emailNotificationService.sendCommentReceived(
                    post.getUserId(),
                    user.getUsername(),
                    post.getId()
                );
            } catch (Exception ignored) { }
        }

        UserProfile profile = profileRepository.findByUserId(user.getId()).orElse(null);
        String avatarUrl = resolveAvatarUrl(user.getId());

        return commentMapper.toResponse(
            saved,
            user.getUsername(),
            profile != null ? profile.getFullName() : null,
            avatarUrl
        );
    }

    @Transactional(readOnly = true)
    public Page<CommentResponse> getComments(UserPrincipal principal, UUID postId, Pageable pageable) {
        getUser(principal); // Validate token

        if (!postRepository.existsById(postId)) {
            throw new NotFoundException("Post non trovato");
        }

        Page<PostComment> comments = commentRepository.findByPostIdOrderByCreatedAtDesc(postId, pageable);

        // Batch load user data
        List<UUID> userIds = comments.getContent().stream()
            .map(PostComment::getUserId)
            .distinct()
            .toList();

        Map<UUID, User> usersById = userRepository.findAllById(userIds).stream()
            .collect(Collectors.toMap(User::getId, Function.identity()));

        Map<UUID, UserProfile> profilesById = profileRepository.findByUserIdIn(userIds).stream()
            .collect(Collectors.toMap(p -> p.getUser().getId(), Function.identity()));

        Map<UUID, String> avatarsById = loadAvatarUrls(userIds);

        return comments.map(comment -> {
            User user = usersById.get(comment.getUserId());
            UserProfile profile = profilesById.get(comment.getUserId());
            String avatarUrl = avatarsById.get(comment.getUserId());
            return commentMapper.toResponse(
                comment,
                user != null ? user.getUsername() : null,
                profile != null ? profile.getFullName() : null,
                avatarUrl
            );
        });
    }

    @Transactional
    public void deleteComment(UserPrincipal principal, UUID postId, UUID commentId) {
        User user = getUser(principal);

        if (!postRepository.existsById(postId)) {
            throw new NotFoundException("Post non trovato");
        }

        if (!commentRepository.existsByIdAndUserId(commentId, user.getId())) {
            throw new NotFoundException("Commento non trovato o non autorizzato");
        }

        commentRepository.deleteById(commentId);
    }

    @Transactional(readOnly = true)
    public long getCommentCount(UUID postId) {
        return commentRepository.countByPostId(postId);
    }

    private User getUser(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        return userRepository.findById(principal.userId())
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
    }

    private String resolveAvatarUrl(UUID userId) {
        return mediaObjectRepository
            .findFirstByOwnerTypeAndOwnerIdOrderByCreatedAtDesc(MediaOwnerType.USER_PROFILE, userId)
            .map(media -> media.getUrl())
            .orElse(null);
    }

    private Map<UUID, String> loadAvatarUrls(List<UUID> userIds) {
        return mediaObjectRepository
            .findByOwnerTypeAndOwnerIdIn(MediaOwnerType.USER_PROFILE, userIds)
            .stream()
            .collect(Collectors.toMap(
                media -> media.getOwnerId(),
                media -> media.getUrl(),
                (existing, replacement) -> existing
            ));
    }
}
