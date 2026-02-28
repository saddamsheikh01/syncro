package com.syncro.backend.domain.matchmaking.controller;

import com.syncro.backend.domain.matchmaking.dto.UserMatchResponse;
import com.syncro.backend.domain.matchmaking.service.PeopleService;
import com.syncro.backend.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/people")
@Tag(name = "People", description = "Unified people list with filters and compatibility sort")
@SecurityRequirement(name = "bearer-jwt")
public class PeopleController {

    private final PeopleService peopleService;

    public PeopleController(PeopleService peopleService) {
        this.peopleService = peopleService;
    }

    @GetMapping
    @Operation(summary = "List people with filters and sort (unified list, compatibility or recently active)")
    public ResponseEntity<Page<UserMatchResponse>> getPeople(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(required = false) String q,
        @RequestParam(required = false) String city,
        @RequestParam(required = false) String country,
        @RequestParam(required = false) Integer ageMin,
        @RequestParam(required = false) Integer ageMax,
        @RequestParam(required = false) String gender,
        @RequestParam(required = false) String orientation,
        @RequestParam(required = false) String zodiacSign,
        @RequestParam(required = false) List<UUID> interestTagIds,
        @RequestParam(required = false) String interestTagIdsCsv,
        @RequestParam(required = false) String valuesText,
        @RequestParam(required = false) String context,
        @RequestParam(required = false) Double latitude,
        @RequestParam(required = false) Double longitude,
        @RequestParam(required = false) Double maxDistanceKm,
        @RequestParam(required = false, defaultValue = "compatibility") String sort,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        String qNorm = q != null && !q.isBlank() ? q.trim() : null;
        String cityNorm = city != null && !city.isBlank() ? city.trim() : null;
        String countryNorm = country != null && !country.isBlank() ? country.trim() : null;
        String genderNorm = gender != null && !gender.isBlank() ? gender.trim() : null;
        String orientationNorm = orientation != null && !orientation.isBlank() ? orientation.trim() : null;
        String zodiacNorm = zodiacSign != null && !zodiacSign.isBlank() ? zodiacSign.trim() : null;
        String valuesNorm = valuesText != null && !valuesText.isBlank() ? valuesText.trim() : null;
        String contextNorm = context != null && !context.isBlank() ? context.trim() : null;
        String sortNorm = sort != null && !sort.isBlank() ? sort.trim() : "compatibility";
        List<UUID> resolvedInterestTagIds = resolveInterestTagIds(interestTagIds, interestTagIdsCsv);
        return ResponseEntity.ok(peopleService.getPeople(
            principal,
            qNorm, cityNorm, countryNorm, ageMin, ageMax,
            genderNorm, orientationNorm, zodiacNorm,
            resolvedInterestTagIds, valuesNorm,
            contextNorm,
            latitude, longitude, maxDistanceKm,
            sortNorm, page, size
        ));
    }

    private static List<UUID> resolveInterestTagIds(List<UUID> interestTagIds, String interestTagIdsCsv) {
        if (interestTagIds != null && !interestTagIds.isEmpty()) {
            return interestTagIds;
        }
        if (interestTagIdsCsv == null || interestTagIdsCsv.isBlank()) {
            return null;
        }
        List<UUID> result = new ArrayList<>();
        for (String part : interestTagIdsCsv.split(",")) {
            String trimmed = part.trim();
            if (trimmed.isEmpty()) continue;
            try {
                result.add(UUID.fromString(trimmed));
            } catch (IllegalArgumentException ignored) {
                // skip invalid UUIDs
            }
        }
        return result.isEmpty() ? null : result;
    }
}
