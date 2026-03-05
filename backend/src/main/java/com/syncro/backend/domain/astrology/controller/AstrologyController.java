package com.syncro.backend.domain.astrology.controller;

import com.syncro.backend.domain.astrology.dto.AstrologyCalculationRequest;
import com.syncro.backend.domain.astrology.dto.AstrologyCalculationResponse;
import com.syncro.backend.domain.astrology.dto.PlacementDTO;
import com.syncro.backend.domain.astrology.service.AstrologyCalculationService;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.profile.entity.UserProfile;
import com.syncro.backend.domain.profile.repository.UserProfileRepository;
import com.syncro.backend.domain.zyra.dto.ZyraBirthChartInterpretationRequest;
import com.syncro.backend.domain.zyra.service.ZyraService;
import com.syncro.backend.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/astrology")
@Tag(name = "Astrology", description = "In-house astrology calculation (Swiss Ephemeris)")
public class AstrologyController {

    private final AstrologyCalculationService astrologyCalculationService;
    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;
    private final ZyraService zyraService;

    public AstrologyController(
        AstrologyCalculationService astrologyCalculationService,
        UserProfileRepository userProfileRepository,
        UserRepository userRepository,
        ZyraService zyraService
    ) {
        this.astrologyCalculationService = astrologyCalculationService;
        this.userProfileRepository = userProfileRepository;
        this.userRepository = userRepository;
        this.zyraService = zyraService;
    }

    @PostMapping("/calculate")
    @Operation(summary = "Calculate birth chart (Sun, Moon, Ascendant, Venus, Mars)")
    public ResponseEntity<AstrologyCalculationResponse> calculate(
        @Valid @RequestBody AstrologyCalculationRequest request
    ) {
        AstrologyCalculationResponse response = astrologyCalculationService.calculate(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/calculate-and-save")
    @Operation(summary = "Calculate birth chart and save to profile (authenticated)")
    @SecurityRequirement(name = "bearer-jwt")
    public ResponseEntity<AstrologyCalculationResponse> calculateAndSave(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody AstrologyCalculationRequest request,
        @RequestHeader(value = "Accept-Language", required = false) String acceptLanguage
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        AstrologyCalculationResponse response = astrologyCalculationService.calculate(request);
        UserProfile profile = userProfileRepository.findByUserId(principal.userId())
            .orElseGet(() -> {
                UserProfile p = new UserProfile();
                p.setUser(userRepository.findById(principal.userId()).orElseThrow());
                return userProfileRepository.save(p);
            });
        profile.setBirthDate(request.birthDate());
        profile.setBirthTime(request.birthTime());
        profile.setBirthLatitude(request.birthLatitude());
        profile.setBirthLongitude(request.birthLongitude());
        profile.setSunSign(response.sun().sign());
        profile.setMoonSign(response.moon().sign());
        profile.setVenusSign(response.venus().sign());
        profile.setMarsSign(response.mars().sign());
        profile.setSunDegree(response.sun().degreeInSign());
        profile.setMoonDegree(response.moon().degreeInSign());
        profile.setVenusDegree(response.venus().degreeInSign());
        profile.setMarsDegree(response.mars().degreeInSign());
        if (response.ascendant() != null) {
            profile.setAscSign(response.ascendant().sign());
            profile.setAscDegree(response.ascendant().degreeInSign());
        } else {
            profile.setAscSign(null);
            profile.setAscDegree(null);
        }
        profile.setZodiacSign(response.sun().sign());

        String interpretation = null;
        try {
            ZyraBirthChartInterpretationRequest zyraRequest = toInterpretationRequest(response);
            interpretation = zyraService.interpretBirthChart(principal, zyraRequest, acceptLanguage).interpretation();
        } catch (Exception ignored) {
            // Leave interpretation null on Zyra failure; chart is still saved
        }
        profile.setZyraBirthChartInterpretation(interpretation != null && !interpretation.isBlank() ? interpretation : null);
        userProfileRepository.save(profile);

        User user = userRepository.findById(principal.userId()).orElse(null);
        if (user != null) {
            zyraService.refreshProfileRecap(user);
        }

        AstrologyCalculationResponse responseWithInterpretation = new AstrologyCalculationResponse(
            response.sun(),
            response.moon(),
            response.ascendant(),
            response.venus(),
            response.mars(),
            response.hasBirthTime(),
            interpretation
        );
        return ResponseEntity.ok(responseWithInterpretation);
    }

    private static ZyraBirthChartInterpretationRequest toInterpretationRequest(AstrologyCalculationResponse r) {
        return new ZyraBirthChartInterpretationRequest(
            placement(r.sun()),
            placement(r.moon()),
            r.ascendant() != null ? placement(r.ascendant()) : null,
            placement(r.venus()),
            placement(r.mars())
        );
    }

    private static ZyraBirthChartInterpretationRequest.PlacementInput placement(PlacementDTO p) {
        return new ZyraBirthChartInterpretationRequest.PlacementInput(p.sign().name(), p.degreeInSign());
    }
}
