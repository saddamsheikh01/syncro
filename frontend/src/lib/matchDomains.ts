import type { DomainScores, MatchDomain } from "@/types/matches";

export type DomainFilter = "ALL" | MatchDomain;

type DomainScoreKey = keyof DomainScores;

export type MatchDomainMeta = {
  domain: MatchDomain;
  key: DomainScoreKey;
  label: string;
  emoji: string;
};

export type MatchDomainScore = MatchDomainMeta & {
  score: number;
};

export type MatchDomainSlot = MatchDomainMeta & {
  score: number | null;
  missing: boolean;
};

type TranslateLabel = (label: string) => string;

const identityTranslate: TranslateLabel = (label) => label;

const DOMAIN_META: Record<MatchDomain, MatchDomainMeta> = {
  LOVE: {
    domain: "LOVE",
    key: "love",
    label: "Love",
    emoji: "\u2764", // ❤ heart (widely supported)
  },
  FRIENDSHIP: {
    domain: "FRIENDSHIP",
    key: "friendship",
    label: "Friendship",
    emoji: "\u{1F91D}",
  },
  WORK: {
    domain: "WORK",
    key: "work",
    label: "Work",
    emoji: "\u{1F4BC}",
  },
  PROJECTS: {
    domain: "PROJECTS",
    key: "projects",
    label: "Projects",
    emoji: "\u{1F680}",
  },
  HOBBY: {
    domain: "HOBBY",
    key: "hobby",
    label: "Hobby",
    emoji: "\u{1F3A8}",
  },
  GROWTH: {
    domain: "GROWTH",
    key: "growth",
    label: "Growth",
    emoji: "\u{1F331}",
  },
};

export const MATCH_DOMAIN_ORDER: MatchDomain[] = [
  "WORK",
  "PROJECTS",
  "FRIENDSHIP",
  "HOBBY",
  "GROWTH",
  "LOVE",
];

export const getMatchDomainMeta = (domain: MatchDomain): MatchDomainMeta =>
  DOMAIN_META[domain];

export const formatMatchDomainLabel = (
  domain: MatchDomain,
  translate: TranslateLabel = identityTranslate,
) => {
  const meta = getMatchDomainMeta(domain);
  return `${meta.emoji} ${translate(meta.label)}`;
};

export const getDomainFilterItems = (
  translate: TranslateLabel = identityTranslate,
): Array<{
  id: DomainFilter;
  label: string;
}> => [
  { id: "ALL", label: `\u{2728} ${translate("All contexts")}` },
  ...MATCH_DOMAIN_ORDER.map((domain) => ({
    id: domain,
    label: formatMatchDomainLabel(domain, translate),
  })),
];

export const resolveMatchDomainScores = (
  breakdown: unknown,
): MatchDomainScore[] => {
  if (!breakdown || typeof breakdown !== "object" || Array.isArray(breakdown)) {
    return [];
  }

  const domainsRaw = (breakdown as { domains?: unknown }).domains;
  if (!domainsRaw || typeof domainsRaw !== "object" || Array.isArray(domainsRaw)) {
    return [];
  }

  const domains = domainsRaw as Record<string, unknown>;
  const orderIndex = new Map(MATCH_DOMAIN_ORDER.map((domain, index) => [domain, index]));

  const scores = MATCH_DOMAIN_ORDER.map((domain) => {
    const meta = getMatchDomainMeta(domain);
    const rawScore = domains[meta.key] ?? domains[domain];
    if (typeof rawScore !== "number" || !Number.isFinite(rawScore)) {
      return null;
    }

    return {
      ...meta,
      score: Math.max(0, Math.min(100, rawScore)),
    } satisfies MatchDomainScore;
  }).filter((item): item is MatchDomainScore => item !== null);

  scores.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return (orderIndex.get(a.domain) ?? 0) - (orderIndex.get(b.domain) ?? 0);
  });

  return scores;
};

export const resolveMatchDomainSlots = (
  breakdown: unknown,
): MatchDomainSlot[] => {
  const orderIndex = new Map(
    MATCH_DOMAIN_ORDER.map((domain, index) => [domain, index]),
  );

  if (!breakdown || typeof breakdown !== "object" || Array.isArray(breakdown)) {
    return MATCH_DOMAIN_ORDER.map((domain) => ({
      ...getMatchDomainMeta(domain),
      score: null,
      missing: true,
    }));
  }

  const domainsRaw = (breakdown as { domains?: unknown }).domains;
  const domains =
    domainsRaw && typeof domainsRaw === "object" && !Array.isArray(domainsRaw)
      ? (domainsRaw as Record<string, unknown>)
      : {};

  const slots = MATCH_DOMAIN_ORDER.map((domain) => {
    const meta = getMatchDomainMeta(domain);
    const rawScore = domains[meta.key] ?? domains[domain];
    const score =
      typeof rawScore === "number" && Number.isFinite(rawScore)
        ? Math.max(0, Math.min(100, rawScore))
        : null;

    return {
      ...meta,
      score,
      missing: score == null,
    };
  });

  slots.sort((a, b) => {
    if (a.missing !== b.missing) {
      return a.missing ? 1 : -1;
    }
    return (orderIndex.get(a.domain) ?? 0) - (orderIndex.get(b.domain) ?? 0);
  });

  return slots;
};

export const resolveTopMatchDomain = (
  breakdown: unknown,
): { domain: MatchDomain; score: number } | null => {
  const [top] = resolveMatchDomainScores(breakdown);
  if (!top) return null;
  return { domain: top.domain, score: top.score };
};
