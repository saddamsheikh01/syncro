package com.syncro.backend.domain.auth.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.config.GoogleAuthConfig;
import java.time.Instant;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class GoogleIdTokenVerifierService {

    private static final Logger logger = LoggerFactory.getLogger(GoogleIdTokenVerifierService.class);
    private static final Set<String> TRUSTED_ISSUERS = Set.of(
        "accounts.google.com",
        "https://accounts.google.com"
    );

    private final GoogleAuthConfig config;
    private final RestTemplate restTemplate;

    public GoogleIdTokenVerifierService(GoogleAuthConfig config) {
        this.config = config;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        int timeoutMs = Math.max(config.getTimeoutSeconds(), 1) * 1000;
        requestFactory.setConnectTimeout(timeoutMs);
        requestFactory.setReadTimeout(timeoutMs);
        this.restTemplate = new RestTemplate(requestFactory);
    }

    public GoogleIdentity verify(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new BadRequestException("Google token is missing");
        }
        if (!config.isConfigured()) {
            throw new IllegalStateException("Google OAuth is not configured");
        }

        String url = UriComponentsBuilder
            .fromUriString(config.getTokenInfoUrl())
            .queryParam("id_token", idToken)
            .build(true)
            .toUriString();

        GoogleTokenInfoResponse tokenInfo;
        try {
            tokenInfo = restTemplate.getForObject(url, GoogleTokenInfoResponse.class);
        } catch (RestClientException ex) {
            logger.warn("Invalid Google token: {}", ex.getMessage());
            throw new UnauthorizedException("Invalid Google token");
        }

        if (tokenInfo == null) {
            throw new UnauthorizedException("Invalid Google token");
        }
        if (!config.getClientId().equals(tokenInfo.aud())) {
            throw new UnauthorizedException("Invalid Google token");
        }
        if (tokenInfo.iss() == null || !TRUSTED_ISSUERS.contains(tokenInfo.iss())) {
            throw new UnauthorizedException("Invalid Google token");
        }
        if (tokenInfo.sub() == null || tokenInfo.sub().isBlank()) {
            throw new UnauthorizedException("Invalid Google token");
        }
        if (tokenInfo.email() == null || tokenInfo.email().isBlank()) {
            throw new UnauthorizedException("Invalid Google token");
        }
        if (!parseBooleanClaim(tokenInfo.emailVerified())) {
            throw new UnauthorizedException("Google email is not verified");
        }

        long expirationEpochSeconds = parseNumericClaim(tokenInfo.exp());
        if (Instant.now().getEpochSecond() >= expirationEpochSeconds) {
            throw new UnauthorizedException("Google token has expired");
        }

        return new GoogleIdentity(tokenInfo.sub(), tokenInfo.email(), tokenInfo.locale());
    }

    private long parseNumericClaim(String value) {
        if (value == null || value.isBlank()) {
            throw new UnauthorizedException("Invalid Google token");
        }
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException ex) {
            throw new UnauthorizedException("Invalid Google token");
        }
    }

    private boolean parseBooleanClaim(String value) {
        if (value == null) {
            return false;
        }
        String normalized = value.trim().toLowerCase();
        return "true".equals(normalized) || "1".equals(normalized);
    }

    public record GoogleIdentity(
        String subject,
        String email,
        String locale
    ) {
    }

    private record GoogleTokenInfoResponse(
        String iss,
        String aud,
        String sub,
        String email,
        @JsonProperty("email_verified") String emailVerified,
        String exp,
        String locale
    ) {
    }
}
