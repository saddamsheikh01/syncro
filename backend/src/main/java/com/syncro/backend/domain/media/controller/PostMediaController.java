package com.syncro.backend.domain.media.controller;

import com.syncro.backend.domain.media.dto.MediaResponse;
import com.syncro.backend.domain.media.service.MediaService;
import com.syncro.backend.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/posts")
@Tag(name = "Post Media", description = "Media associati ai post")
@SecurityRequirement(name = "bearer-jwt")
public class PostMediaController {

    private final MediaService mediaService;

    public PostMediaController(MediaService mediaService) {
        this.mediaService = mediaService;
    }

    @GetMapping("/{postId}/media")
    @Operation(summary = "Lista media di un post")
    public ResponseEntity<Page<MediaResponse>> getPostMedia(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID postId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(mediaService.listPostMedia(principal, postId, page, size));
    }

    @PostMapping(value = "/{postId}/media", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload media per post")
    public ResponseEntity<MediaResponse> uploadPostMedia(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID postId,
        @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(mediaService.uploadPostMedia(principal, postId, file));
    }

    @DeleteMapping("/{postId}/media/{mediaId}")
    @Operation(summary = "Elimina media da un post")
    public ResponseEntity<Void> deletePostMedia(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID postId,
        @PathVariable UUID mediaId
    ) {
        mediaService.deletePostMedia(principal, postId, mediaId);
        return ResponseEntity.noContent().build();
    }
}
