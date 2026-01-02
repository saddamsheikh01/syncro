package com.syncro.backend.domain.favorites.controller;

import com.syncro.backend.domain.favorites.dto.AddFavoriteRequest;
import com.syncro.backend.domain.favorites.dto.FavoriteResponse;
import com.syncro.backend.domain.favorites.service.FavoriteService;
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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/favorites")
@Tag(name = "Favorites", description = "Preferiti utente")
@SecurityRequirement(name = "bearer-jwt")
public class FavoritesController {

    private final FavoriteService favoriteService;

    public FavoritesController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @GetMapping
    @Operation(summary = "Lista preferiti")
    public ResponseEntity<Page<FavoriteResponse>> getFavorites(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(required = false) String type,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(favoriteService.getFavorites(principal, type, page, size));
    }

    @PostMapping
    @Operation(summary = "Aggiungi preferito")
    public ResponseEntity<FavoriteResponse> addFavorite(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody AddFavoriteRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(favoriteService.addFavorite(principal, request));
    }

    @DeleteMapping
    @Operation(summary = "Rimuovi preferito")
    public ResponseEntity<Void> removeFavorite(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(required = false) UUID placeId,
        @RequestParam(required = false) UUID experienceId
    ) {
        favoriteService.removeFavorite(principal, placeId, experienceId);
        return ResponseEntity.noContent().build();
    }
}
