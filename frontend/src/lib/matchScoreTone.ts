import type { BadgeTone } from "@/components/elements/Badge";

export interface MatchScoreStyle {
  tone: BadgeTone;
  emoji: string;
  label: string;
}

/**
 * Calcola il tono/colore e l'emoji per un punteggio di match.
 *
 * Soglie:
 * - 0-19:   rosso (danger)        💔 Match molto basso
 * - 20-39:  arancione (warning)   🌱 Match basso
 * - 40-59:  giallo (caution)      ⚡ Match discreto
 * - 60-79:  verde chiaro          ✨ Match buono
 * - 80-100: verde scuro           💖 Match eccellente
 */
export const getMatchScoreStyle = (score: number): MatchScoreStyle => {
  if (score < 20) {
    return { tone: "danger", emoji: "💔", label: "Molto basso" };
  }
  if (score < 40) {
    return { tone: "warning", emoji: "🌱", label: "Basso" };
  }
  if (score < 60) {
    return { tone: "caution", emoji: "⚡", label: "Discreto" };
  }
  if (score < 80) {
    return { tone: "success-light", emoji: "✨", label: "Buono" };
  }
  return { tone: "success", emoji: "💖", label: "Eccellente" };
};

/**
 * Restituisce solo il tone per compatibilità con componenti esistenti.
 */
export const getMatchScoreTone = (score: number): BadgeTone => {
  return getMatchScoreStyle(score).tone;
};

/**
 * Restituisce solo l'emoji per il punteggio.
 */
export const getMatchScoreEmoji = (score: number): string => {
  return getMatchScoreStyle(score).emoji;
};

/**
 * Formatta il punteggio con emoji.
 * Es: "85" -> "💚 85%"
 */
export const formatMatchScoreWithEmoji = (score: number): string => {
  const { emoji } = getMatchScoreStyle(score);
  return `${emoji} ${score}%`;
};
