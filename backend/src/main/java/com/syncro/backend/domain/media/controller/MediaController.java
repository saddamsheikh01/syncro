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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/media")
@Tag(name = "Media", description = "Gestione media")
@SecurityRequirement(name = "bearer-jwt")
public class MediaController {

    private final MediaService mediaService;

    public MediaController(MediaService mediaService) {
        this.mediaService = mediaService;
    }

    @GetMapping
    @Operation(summary = "Lista media per owner")
    public ResponseEntity<Page<MediaResponse>> getMediaByOwner(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam String ownerType,
        @RequestParam UUID ownerId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(mediaService.listByOwner(principal, ownerType, ownerId, page, size));
    }

    @PostMapping(consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload media")
    public ResponseEntity<MediaResponse> uploadMedia(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam("file") MultipartFile file,
        @RequestParam String ownerType,
        @RequestParam UUID ownerId
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(mediaService.uploadMedia(principal, ownerType, ownerId, file));
    }
}
