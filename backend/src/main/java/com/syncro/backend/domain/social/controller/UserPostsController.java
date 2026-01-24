package com.syncro.backend.domain.social.controller;

import com.syncro.backend.domain.social.dto.PostResponse;
import com.syncro.backend.domain.social.service.PostService;
import com.syncro.backend.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "Users Posts", description = "Post pubblici per utente")
@SecurityRequirement(name = "bearer-jwt")
public class UserPostsController {

    private final PostService postService;

    public UserPostsController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping("/{userId}/posts")
    @Operation(summary = "Ultimi post dell'utente")
    public ResponseEntity<Page<PostResponse>> getUserPosts(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID userId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(postService.getUserPosts(principal, userId, page, size));
    }
}
