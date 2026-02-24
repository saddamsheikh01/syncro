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

const GENERIC_PLACEHOLDERS = [
  "relevant connection based on your current context",
  "match basato su compatibilita generale",
];

export const looksItalianMatchCopy = (value?: string | null) => {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return ITALIAN_MATCH_HINTS.some((hint) => normalized.includes(hint));
};

export const isGenericOrEmptyExplanation = (value: string | null | undefined): boolean => {
  if (!value || !value.trim()) return true;
  const normalized = value.trim().toLowerCase();
  return GENERIC_PLACEHOLDERS.some((p) => normalized === p || normalized.startsWith(p));
};

export const resolveMatchCopy = (
  value: string | null | undefined,
  fallback: string | null,
) => {
  if (!value || !value.trim()) return fallback;
  if (isGenericOrEmptyExplanation(value)) return fallback;
  if (looksItalianMatchCopy(value)) return fallback;
  return value.trim();
};

const MIN_SCORE_FOR_CONTEXTUAL = 25;

type TranslateFn = (key: string, params?: Record<string, string>) => string;

const DOMAIN_LABEL_KEYS: Record<string, string> = {
  work: "match.domain.work",
  projects: "match.domain.projects",
  friendship: "match.domain.friendship",
  hobby: "match.domain.hobby",
  growth: "match.domain.growth",
  love: "match.domain.love",
};

const STRENGTH_EXCEPTIONAL = 85;
const STRENGTH_HIGH = 70;
const STRENGTH_MID = 50;
const CLOSE_SCORE_GAP = 5;

function strengthKey(score: number): string {
  if (score >= STRENGTH_EXCEPTIONAL) return "match.strength.exceptional";
  if (score >= STRENGTH_HIGH) return "match.strength.veryStrong";
  if (score >= STRENGTH_MID) return "match.strength.strong";
  return "match.strength.goodFit";
}

function hashForTieBreak(seed: string, label: string): number {
  let h = 0;
  const s = seed + label;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

function pickVariant(seed: string, count: number): number {
  if (!seed || count <= 1) return 0;
  return Math.abs(hashForTieBreak(seed, "v")) % count;
}

export const buildContextualMatchDescription = (
  breakdown: unknown,
  t: TranslateFn,
  matchSeed?: string,
): string | null => {
  if (!breakdown || typeof breakdown !== "object" || Array.isArray(breakdown)) {
    return null;
  }

  const obj = breakdown as Record<string, unknown>;
  const domainsRaw = obj.domains;
  if (!domainsRaw || typeof domainsRaw !== "object" || Array.isArray(domainsRaw)) {
    return null;
  }

  const domains = domainsRaw as Record<string, unknown>;
  const parts: { score: number; label: string; key: string }[] = [];
  for (const [key, raw] of Object.entries(domains)) {
    if (typeof raw === "number" && Number.isFinite(raw) && raw >= MIN_SCORE_FOR_CONTEXTUAL) {
      const labelKey = DOMAIN_LABEL_KEYS[key] ?? `match.domain.${key}`;
      parts.push({ score: Math.round(raw), label: t(labelKey), key });
    }
  }

  if (parts.length === 0) return null;

  parts.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (!matchSeed) return 0;
    return hashForTieBreak(matchSeed, a.key) - hashForTieBreak(matchSeed, b.key);
  });

  const first = parts[0]!;
  const second = parts[1];
  const third = parts[2];
  const includeThird =
    second &&
    third &&
    first.label !== second.label &&
    second.label !== third.label &&
    second.score - third.score <= CLOSE_SCORE_GAP;

  if (!second || first.label === second.label) {
    const strength = t(strengthKey(first.score));
    const variant = pickVariant(matchSeed ?? "", 2);
    const key =
      variant === 0 ? "match.compatibilityTextOne" : "match.compatibilityTextOneAlt";
    return t(key, { strength, a: first.label });
  }

  if (includeThird) {
    const strength = t(strengthKey(first.score));
    const variant = pickVariant(matchSeed ?? "", 2);
    const key =
      variant === 0 ? "match.compatibilityTextThree" : "match.compatibilityTextThreeAlt";
    return t(key, {
      strength,
      a: first.label,
      b: second.label,
      c: third!.label,
    });
  }

  const strength1 = t(strengthKey(first.score));
  const strength2 = t(strengthKey(second.score));
  const strength = t(strengthKey(first.score));
  const variant = pickVariant(matchSeed ?? "", 3);
  const key =
    variant === 0
      ? "match.compatibilityTextTwo"
      : variant === 1
        ? "match.compatibilityTextTwoAlt"
        : "match.compatibilityTextTwoAlt2";
  return t(key, {
    strength1,
    strength2,
    strength,
    a: first.label,
    b: second.label,
  });
};
