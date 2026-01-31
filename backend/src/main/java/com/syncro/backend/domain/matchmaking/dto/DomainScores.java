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
     */
    public int average() {
        int sum = 0;
        int count = 0;
        if (love != null) { sum += love; count++; }
        if (friendship != null) { sum += friendship; count++; }
        if (work != null) { sum += work; count++; }
        if (projects != null) { sum += projects; count++; }
        if (hobby != null) { sum += hobby; count++; }
        if (growth != null) { sum += growth; count++; }
        return count > 0 ? sum / count : 0;
    }
}
