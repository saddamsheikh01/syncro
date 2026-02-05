import type { TestType } from "@/types/insights";

const TEST_EMOJI: Record<TestType, string> = {
  INTERESTS: "\u{1F9ED}",
  LIFESTYLE: "\u{1F33F}",
  VALUES: "\u{2696}\u{FE0F}",
  OBJECTIVES: "\u{1F3AF}",
  PSY: "\u{1F9E0}",
  ASTRO: "\u{1FA90}",
  OTHER: "\u{1F4DD}",
};

const normalizeTitle = (value: string) => value.trim().toLowerCase();

export const getTestEmoji = (type?: TestType | null, title?: string | null) => {
  if (type && TEST_EMOJI[type]) {
    return TEST_EMOJI[type];
  }
  if (!title) return "";
  const normalized = normalizeTitle(title);
  if (normalized.includes("tema natale") || normalized.includes("astrolog")) {
    return TEST_EMOJI.ASTRO;
  }
  if (normalized.includes("interess") || normalized.includes("passion")) {
    return TEST_EMOJI.INTERESTS;
  }
  if (normalized.includes("lifestyle")) {
    return TEST_EMOJI.LIFESTYLE;
  }
  if (normalized.includes("valori")) {
    return TEST_EMOJI.VALUES;
  }
  if (normalized.includes("obiettivi")) {
    return TEST_EMOJI.OBJECTIVES;
  }
  if (normalized.includes("psicolog")) {
    return TEST_EMOJI.PSY;
  }
  return TEST_EMOJI.OTHER;
};

export const formatTestTitle = (title: string, type?: TestType | null) => {
  const emoji = getTestEmoji(type, title);
  return emoji ? `${emoji} ${title}` : title;
};
