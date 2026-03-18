package com.syncro.backend.security;

import com.syncro.backend.domain.expats.entity.ExpatsAnonymousSession;
import com.syncro.backend.domain.expats.repository.ExpatsAnonymousSessionRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Optional;

/**
 * When JWT is not present, resolves expat anonymous session token (header X-Expat-Session-Token)
 * and, if the session is converted to a user, sets that user as the security principal.
 * This allows the expat flow (landing → funnel → activation → WOW) to call relocation APIs
 * without 401 when the user has just converted but the frontend still sends the session token.
 */
@Component
public class ExpatSessionAuthFilter extends OncePerRequestFilter {

    public static final String HEADER_EXPAT_SESSION_TOKEN = "X-Expat-Session-Token";

    private final ExpatsAnonymousSessionRepository sessionRepository;

    public ExpatSessionAuthFilter(ExpatsAnonymousSessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if (SecurityContextHolder.getContext().getAuthentication() != null
                && SecurityContextHolder.getContext().getAuthentication().isAuthenticated()) {
            filterChain.doFilter(request, response);
            return;
        }

        String sessionToken = request.getHeader(HEADER_EXPAT_SESSION_TOKEN);
        if (sessionToken == null || sessionToken.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        Optional<ExpatsAnonymousSession> sessionOpt = sessionRepository.findBySessionToken(sessionToken.trim());
        if (sessionOpt.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }

        ExpatsAnonymousSession session = sessionOpt.get();
        if (session.getConvertedUser() == null) {
            filterChain.doFilter(request, response);
            return;
        }

        UserPrincipal principal = new UserPrincipal(session.getConvertedUser().getId());
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                Collections.emptyList()
        );
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        filterChain.doFilter(request, response);
    }
}
