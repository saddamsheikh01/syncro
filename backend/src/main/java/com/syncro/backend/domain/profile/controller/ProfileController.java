package com.syncro.backend.domain.profile.controller;

import com.syncro.backend.domain.profile.dto.UserProfileRequest;
import com.syncro.backend.domain.profile.dto.UserProfileResponse;
import com.syncro.backend.domain.profile.dto.UserSummaryResponse;
import com.syncro.backend.domain.profile.entity.Gender;
import com.syncro.backend.domain.profile.entity.Orientation;
import com.syncro.backend.domain.profile.entity.ZodiacSign;
import com.syncro.backend.domain.profile.service.UserProfileService;
import com.syncro.backend.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/profile")
@Tag(name = "Profile", description = "User profile")
@SecurityRequirement(name = "bearer-jwt")
public class ProfileController {

    private final UserProfileService profileService;

    public ProfileController(UserProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    @Operation(summary = "Get profile")
    public ResponseEntity<UserProfileResponse> getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(profileService.getProfile(principal));
    }

    @PutMapping
    @Operation(summary = "Create or update profile")
    public ResponseEntity<UserProfileResponse> upsertProfile(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody UserProfileRequest request
    ) {
        return ResponseEntity.ok(profileService.upsertProfile(principal, request));
    }

    @GetMapping("/search")
    @Operation(summary = "Search users with optional filters (location, age, gender, interests, values, zodiac)")
    public ResponseEntity<Page<UserSummaryResponse>> searchUsers(
        @RequestParam(required = false, defaultValue = "") String q,
        @RequestParam(required = false) String city,
        @RequestParam(required = false) String country,
        @RequestParam(required = false) Integer ageMin,
        @RequestParam(required = false) Integer ageMax,
        @RequestParam(required = false) String gender,
        @RequestParam(required = false) String orientation,
        @RequestParam(required = false) String zodiacSign,
        @RequestParam(required = false) List<UUID> interestTagIds,
        @RequestParam(required = false) String valuesText,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        boolean hasFilters = hasAnyFilter(city, country, ageMin, ageMax, gender, orientation, zodiacSign, interestTagIds, valuesText);
        if (!hasFilters) {
            return ResponseEntity.ok(profileService.searchUsers(q, PageRequest.of(page, size)));
        }
        Gender genderEnum = parseGender(gender);
        Orientation orientationEnum = parseOrientation(orientation);
        ZodiacSign zodiacEnum = parseZodiacSign(zodiacSign);
        return ResponseEntity.ok(profileService.searchUsersWithFilters(
            q != null && !q.isBlank() ? q.trim() : null,
            city,
            country,
            ageMin,
            ageMax,
            genderEnum,
            orientationEnum,
            zodiacEnum,
            interestTagIds,
            valuesText,
            PageRequest.of(page, size)
        ));
    }

    private static boolean hasAnyFilter(
        String city,
        String country,
        Integer ageMin,
        Integer ageMax,
        String gender,
        String orientation,
        String zodiacSign,
        List<UUID> interestTagIds,
        String valuesText
    ) {
        return (city != null && !city.isBlank())
            || (country != null && !country.isBlank())
            || (ageMin != null && ageMin > 0)
            || (ageMax != null && ageMax > 0)
            || (gender != null && !gender.isBlank())
            || (orientation != null && !orientation.isBlank())
            || (zodiacSign != null && !zodiacSign.isBlank())
            || (interestTagIds != null && !interestTagIds.isEmpty())
            || (valuesText != null && !valuesText.isBlank());
    }

    private static Gender parseGender(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return Gender.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static Orientation parseOrientation(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return Orientation.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static ZodiacSign parseZodiacSign(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            ZodiacSign sign = ZodiacSign.valueOf(value.trim().toUpperCase());
            return sign == ZodiacSign.UNKNOWN ? null : sign;
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
