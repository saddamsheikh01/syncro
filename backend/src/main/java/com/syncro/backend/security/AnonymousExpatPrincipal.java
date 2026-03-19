package com.syncro.backend.security;

import java.security.Principal;
import java.util.UUID;

/**
 * Authenticated principal for anonymous expat funnel users (WOW / relocation before register).
 * Resolved from {@code X-Expat-Session-Token} when the session is not yet converted.
 */
public record AnonymousExpatPrincipal(UUID sessionId) implements Principal {

    @Override
    public String getName() {
        return "expat-anon:" + sessionId;
    }
}
