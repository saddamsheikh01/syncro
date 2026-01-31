package com.syncro.backend.domain.matchmaking.entity;

/**
 * Domini di compatibilita per il matchmaking.
 * Ogni dominio ha pesi diversi per le dimensioni di valutazione.
 */
public enum MatchDomain {
    LOVE,
    FRIENDSHIP,
    WORK,
    PROJECTS,
    HOBBY,
    GROWTH
}
