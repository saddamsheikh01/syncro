package com.syncro.backend.domain.social.controller;

import com.syncro.backend.domain.social.dto.CommentResponse;
import com.syncro.backend.domain.social.dto.CreateCommentRequest;
import com.syncro.backend.domain.social.service.PostCommentService;
import com.syncro.backend.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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
@RequestMapping("/api/v1/posts/{postId}/comments")
@Tag(name = "Post Comments", description = "Gestione commenti sui post")
@SecurityRequirement(name = "bearer-jwt")
public class PostCommentsController {

    private final PostCommentService commentService;

    public PostCommentsController(PostCommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping
    @Operation(summary = "Lista commenti di un post")
    public ResponseEntity<Page<CommentResponse>> getComments(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID postId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Page<CommentResponse> result = commentService.getComments(
            principal,
            postId,
            PageRequest.of(page, Math.min(size, 50))
        );
        return ResponseEntity.ok(result);
    }

    @PostMapping
    @Operation(summary = "Aggiungi commento a un post")
    public ResponseEntity<CommentResponse> createComment(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID postId,
        @Valid @RequestBody CreateCommentRequest request
    ) {
        CommentResponse response = commentService.createComment(principal, postId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{commentId}")
    @Operation(summary = "Elimina un commento")
    public ResponseEntity<Void> deleteComment(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID postId,
        @PathVariable UUID commentId
    ) {
        commentService.deleteComment(principal, postId, commentId);
        return ResponseEntity.noContent().build();
    }
}
