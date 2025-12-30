package com.syncro.backend.domain.tags.controller;

import com.syncro.backend.domain.tags.dto.TagListResponse;
import com.syncro.backend.domain.tags.service.TagService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tags")
@Tag(name = "Tags", description = "Tag disponibili")
@SecurityRequirement(name = "bearer-jwt")
public class TagsController {

    private final TagService tagService;

    public TagsController(TagService tagService) {
        this.tagService = tagService;
    }

    @GetMapping
    @Operation(summary = "Lista tag")
    public ResponseEntity<TagListResponse> getTags() {
        return ResponseEntity.ok(tagService.getTags());
    }
}
