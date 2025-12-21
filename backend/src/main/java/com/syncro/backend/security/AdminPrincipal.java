package com.syncro.backend.security;

import java.security.Principal;
import java.util.UUID;

public record AdminPrincipal(UUID adminId, String role) implements Principal {

    @Override
    public String getName() {
        return adminId.toString();
    }
}
