package com.syncro.backend.domain.social.controller;

import com.syncro.backend.domain.social.dto.CreatePostRequest;
import com.syncro.backend.domain.social.dto.PostReactionRequest;
import com.syncro.backend.domain.social.dto.PostResponse;
import com.syncro.backend.domain.social.dto.UpdatePostRequest;
import com.syncro.backend.domain.social.entity.PostMood;
import com.syncro.backend.domain.social.entity.PostScope;
import com.syncro.backend.domain.social.entity.PostTimeframe;
import com.syncro.backend.domain.social.service.PostService;
import com.syncro.backend.domain.profile.entity.Gender;
import com.syncro.backend.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/posts")
@Tag(name = "Posts", description = "Post e feed")
@SecurityRequirement(name = "bearer-jwt")
public class PostsController {

    private final PostService postService;

    public PostsController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping
    @Operation(summary = "Feed post")
    public ResponseEntity<Page<PostResponse>> getFeed(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(required = false) Double lat,
        @RequestParam(required = false) Double lng,
        @RequestParam(required = false) Double radiusKm,
        @RequestParam(required = false) PostScope scope,
        @RequestParam(required = false) PostMood mood,
        @RequestParam(required = false) PostTimeframe timeframe,
        @RequestParam(required = false) String city,
        @RequestParam(required = false) Integer minAge,
        @RequestParam(required = false) Integer maxAge,
        @RequestParam(required = false) Gender gender,
        @RequestParam(required = false) Integer minCompatibility,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(postService.getFeed(
            principal,
            lat,
            lng,
            radiusKm,
            scope,
            mood,
            timeframe,
            city,
            minAge,
            maxAge,
            gender,
            minCompatibility,
            page,
            size
        ));
    }

    @GetMapping("/search")
    @Operation(summary = "Cerca post per contenuto")
    public ResponseEntity<Page<PostResponse>> searchPosts(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam String q,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(postService.searchPosts(principal, q, page, size));
    }

    @PostMapping
    @Operation(summary = "Crea post")
    public ResponseEntity<PostResponse> createPost(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody CreatePostRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(postService.createPost(principal, request));
    }

    @PutMapping("/{postId}")
    @Operation(summary = "Aggiorna post")
    public ResponseEntity<PostResponse> updatePost(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID postId,
        @Valid @RequestBody UpdatePostRequest request
    ) {
        return ResponseEntity.ok(postService.updatePost(principal, postId, request));
    }

    @DeleteMapping("/{postId}")
    @Operation(summary = "Elimina post")
    public ResponseEntity<Void> deletePost(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID postId
    ) {
        postService.deletePost(principal, postId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{postId}/likes")
    @Operation(summary = "Like post")
    public ResponseEntity<Void> likePost(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID postId
    ) {
        postService.likePost(principal, postId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/{postId}/reactions")
    @Operation(summary = "Reagisci a un post")
    public ResponseEntity<Void> reactToPost(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID postId,
        @Valid @RequestBody PostReactionRequest request
    ) {
        postService.reactToPost(principal, postId, request.reaction());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{postId}/likes")
    @Operation(summary = "Unlike post")
    public ResponseEntity<Void> unlikePost(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID postId
    ) {
        postService.unlikePost(principal, postId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{postId}/reactions")
    @Operation(summary = "Rimuovi reazione post")
    public ResponseEntity<Void> removeReaction(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID postId
    ) {
        postService.unlikePost(principal, postId);
        return ResponseEntity.noContent().build();
    }
}
