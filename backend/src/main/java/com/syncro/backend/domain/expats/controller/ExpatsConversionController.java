package com.syncro.backend.domain.expats.controller;

import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.expats.dto.ConvertSessionRequest;
import com.syncro.backend.domain.expats.service.ExpatsConversionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/expats/anonymous")
@Validated
@Tag(name = "Expats Conversion", description = "Conversione sessione anonima a utente registrato")
@SecurityRequirement(name = "bearer-jwt")
public class ExpatsConversionController {

    private final ExpatsConversionService conversionService;

    public ExpatsConversionController(ExpatsConversionService conversionService) {
        this.conversionService = conversionService;
    }

    @PostMapping("/convert")
    @Operation(summary = "Converte sessione anonima a utente registrato (atomico, idempotente)")
    public ResponseEntity<Map<String, String>> convertSession(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ConvertSessionRequest request) {
        conversionService.convertSession(request.sessionToken(), user);
        return ResponseEntity.ok(Map.of("status", "converted"));
    }
}
