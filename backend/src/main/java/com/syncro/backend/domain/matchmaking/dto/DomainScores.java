package com.syncro.backend.domain.matchmaking.dto;

/**
 * Punteggi per ogni dominio di compatibilita.
 * Tutti i punteggi sono normalizzati 0-100.
 */
public record DomainScores(
    Integer love,
    Integer friendship,
    Integer work,
    Integer projects,
    Integer hobby,
    Integer growth
) {

    /**
     * Calcola la media dei domini disponibili.
     * Garantisce che il risultato sia sempre compreso tra 0 e 100.
     */
    public int average() {
        int sum = 0;
        int count = 0;
        if (love != null) { sum += Math.max(0, love); count++; }
        if (friendship != null) { sum += Math.max(0, friendship); count++; }
        if (work != null) { sum += Math.max(0, work); count++; }
        if (projects != null) { sum += Math.max(0, projects); count++; }
        if (hobby != null) { sum += Math.max(0, hobby); count++; }
        if (growth != null) { sum += Math.max(0, growth); count++; }
        int avg = count > 0 ? sum / count : 0;
        return Math.max(0, Math.min(100, avg));
    }
}
