package com.syncro.backend.security;

import com.syncro.backend.domain.auth.entity.AdminStatus;
import com.syncro.backend.domain.auth.entity.UserStatus;
import com.syncro.backend.domain.auth.repository.AdminUserRepository;
import com.syncro.backend.domain.auth.repository.UserRepository;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final AdminUserRepository adminUserRepository;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            UserRepository userRepository,
            AdminUserRepository adminUserRepository
    ) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.adminUserRepository = adminUserRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);
        try {
            JwtIdentity identity = jwtService.parseAccessToken(token);
            if (!isActive(identity)) {
                SecurityContextHolder.clearContext();
                sendUnauthorized(response, request.getRequestURI(), "Account is not active");
                return;
            }
            Object principal = buildPrincipal(identity);
            List<GrantedAuthority> authorities = identity.subjectType() == SubjectType.ADMIN && identity.role() != null
                    ? List.of(new SimpleGrantedAuthority("ROLE_" + identity.role()))
                    : List.of();
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    principal,
                    token,
                    authorities
            );
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (JwtException ex) {
            SecurityContextHolder.clearContext();
            sendUnauthorized(response, request.getRequestURI(), "Token invalid or expired");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void sendUnauthorized(HttpServletResponse response, String path, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        String body = String.format(
                "{\"timestamp\":\"%s\",\"status\":401,\"error\":\"Unauthorized\",\"message\":\"%s\",\"path\":\"%s\"}",
                Instant.now().toString(),
                message.replace("\"", "\\\""),
                path.replace("\\", "\\\\").replace("\"", "\\\"")
        );
        response.getWriter().write(body);
    }

    private boolean isActive(JwtIdentity identity) {
        if (identity.subjectType() == SubjectType.ADMIN) {
            return adminUserRepository.existsByIdAndStatus(identity.subjectId(), AdminStatus.ACTIVE);
        }
        return userRepository.existsByIdAndStatus(identity.subjectId(), UserStatus.ACTIVE);
    }

    private Object buildPrincipal(JwtIdentity identity) {
        if (identity.subjectType() == SubjectType.ADMIN) {
            return new AdminPrincipal(identity.subjectId(), identity.role());
        }
        return new UserPrincipal(identity.subjectId());
    }
}