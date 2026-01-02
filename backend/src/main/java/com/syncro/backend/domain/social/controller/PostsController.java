package com.syncro.backend.domain.social.controller;

import com.syncro.backend.domain.social.dto.CreatePostRequest;
import com.syncro.backend.domain.social.dto.PostResponse;
import com.syncro.backend.domain.social.service.PostService;
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
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(postService.getFeed(principal, lat, lng, radiusKm, page, size));
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

    @PostMapping("/{postId}/likes")
    @Operation(summary = "Like post")
    public ResponseEntity<Void> likePost(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID postId
    ) {
        postService.likePost(principal, postId);
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
}
