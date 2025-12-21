package com.syncro.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private static final String CLAIM_TYPE = "type";
    private static final String CLAIM_SUBJECT_TYPE = "subjectType";
    private static final String CLAIM_ROLE = "role";
    private final JwtProperties properties;
    private final SecretKey secretKey;

    public JwtService(JwtProperties properties) {
        this.properties = properties;
        this.secretKey = Keys.hmacShaKeyFor(properties.secret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateUserAccessToken(UUID userId) {
        return generateToken(
            userId,
            SubjectType.USER,
            null,
            TokenType.ACCESS,
            Duration.ofMinutes(properties.accessTtlMinutes())
        );
    }

    public String generateUserRefreshToken(UUID userId) {
        return generateToken(
            userId,
            SubjectType.USER,
            null,
            TokenType.REFRESH,
            Duration.ofDays(properties.refreshTtlDays())
        );
    }

    public String generateAdminAccessToken(UUID adminId, String role) {
        return generateToken(
            adminId,
            SubjectType.ADMIN,
            role,
            TokenType.ACCESS,
            Duration.ofMinutes(properties.accessTtlMinutes())
        );
    }

    public String generateAdminRefreshToken(UUID adminId) {
        return generateToken(
            adminId,
            SubjectType.ADMIN,
            null,
            TokenType.REFRESH,
            Duration.ofDays(properties.refreshTtlDays())
        );
    }

    public JwtIdentity parseAccessToken(String token) {
        return parseToken(token, TokenType.ACCESS);
    }

    public UUID parseRefreshToken(String token, SubjectType expectedSubjectType) {
        JwtIdentity identity = parseToken(token, TokenType.REFRESH);
        if (identity.subjectType() != expectedSubjectType) {
            throw new JwtException("Token subject non valido");
        }
        return identity.subjectId();
    }

    public long getAccessTtlSeconds() {
        return Duration.ofMinutes(properties.accessTtlMinutes()).getSeconds();
    }

    public long getRefreshTtlSeconds() {
        return Duration.ofDays(properties.refreshTtlDays()).getSeconds();
    }

    private String generateToken(
        UUID subjectId,
        SubjectType subjectType,
        String role,
        TokenType tokenType,
        Duration ttl
    ) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(ttl);
        var builder = Jwts.builder()
            .issuer(properties.issuer())
            .subject(subjectId.toString())
            .claim(CLAIM_TYPE, tokenType.name())
            .claim(CLAIM_SUBJECT_TYPE, subjectType.name())
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiresAt))
            .signWith(secretKey);
        if (role != null && !role.isBlank()) {
            builder.claim(CLAIM_ROLE, role);
        }
        return builder.compact();
    }

    private JwtIdentity parseToken(String token, TokenType expectedType) {
        Jws<Claims> claimsJws = parseSignedClaims(token);
        Claims claims = claimsJws.getPayload();
        String type = claims.get(CLAIM_TYPE, String.class);
        if (type == null || !expectedType.name().equals(type)) {
            throw new JwtException("Token type non valido");
        }
        String subjectTypeValue = claims.get(CLAIM_SUBJECT_TYPE, String.class);
        if (subjectTypeValue == null) {
            throw new JwtException("Token subject non valido");
        }
        SubjectType subjectType = SubjectType.valueOf(subjectTypeValue);
        String role = claims.get(CLAIM_ROLE, String.class);
        return new JwtIdentity(UUID.fromString(claims.getSubject()), subjectType, role);
    }

    private Jws<Claims> parseSignedClaims(String token) {
        return Jwts.parser()
            .verifyWith(secretKey)
            .requireIssuer(properties.issuer())
            .build()
            .parseSignedClaims(token);
    }
}
