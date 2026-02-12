const ITALIAN_MATCH_HINTS = [
  "condivid",
  "passion",
  "valori",
  "stile",
  "vita",
  "obiettiv",
  "personalita",
  "astrolog",
  "affin",
  "compatibil",
  "amiciz",
  "relazion",
  "lavor",
  "progett",
  "cresc",
  "insieme",
  "potenziale",
  "basato su",
  "filtri correnti",
];

export const looksItalianMatchCopy = (value?: string | null) => {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return ITALIAN_MATCH_HINTS.some((hint) => normalized.includes(hint));
};

export const resolveMatchCopy = (
  value: string | null | undefined,
  fallback: string,
) => {
  if (!value) return fallback;
  return looksItalianMatchCopy(value) ? fallback : value;
};
