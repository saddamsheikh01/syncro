package com.syncro.backend.domain.matchmaking.dto;

import java.util.List;

/**
 * Punteggi per ogni dimensione di valutazione del match.
 * Tutti i punteggi sono normalizzati 0-100.
 * Un valore null indica che la dimensione non e disponibile (test non completato).
 */
public record DimensionScores(
    Integer interests,
    Integer lifestyle,
    Integer values,
    Integer objectives,
    Integer psy,
    Integer astro,
    List<String> sharedTags,
    Double distanceKm
) {

    /**
     * Conta quante dimensioni sono disponibili (non null).
     */
    public int availableCount() {
        int count = 0;
        if (interests != null) count++;
        if (lifestyle != null) count++;
        if (values != null) count++;
        if (objectives != null) count++;
        if (psy != null) count++;
        if (astro != null) count++;
        return count;
    }

    /**
     * Verifica se almeno una dimensione e disponibile.
     */
    public boolean hasAnyDimension() {
        return availableCount() > 0;
    }
}
