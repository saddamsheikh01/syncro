import type { TestType } from "@/types/insights";

const DEFAULT_IMAGE = "/insights/test%20lifestyle.jpg";
const GOALS_IMAGE = "/insights/test%20goals.png";

const IMAGE_BY_TYPE: Record<TestType, string> = {
  INTERESTS: "/insights/test%20interessi.jpg",
  LIFESTYLE: "/insights/test%20lifestyle.jpg",
  VALUES: "/insights/test%20valoriale.png",
  OBJECTIVES: GOALS_IMAGE,
  PSY: "/insights/test%20psicologico.jpg",
  ASTRO: "/insights/astrologia.jpg",
  OTHER: DEFAULT_IMAGE,
};

const normalize = (value: string | null | undefined) =>
  value ? value.trim().toLowerCase() : "";

export const getInsightCardImage = (
  type?: TestType | null,
  title?: string | null
) => {
  if (type && IMAGE_BY_TYPE[type]) {
    return IMAGE_BY_TYPE[type];
  }

  const normalizedTitle = normalize(title);
  if (normalizedTitle.includes("astrolog")) {
    return IMAGE_BY_TYPE.ASTRO;
  }
  if (normalizedTitle.includes("psicolog")) {
    return IMAGE_BY_TYPE.PSY;
  }
  if (normalizedTitle.includes("valor")) {
    return IMAGE_BY_TYPE.VALUES;
  }
  if (normalizedTitle.includes("interess")) {
    return IMAGE_BY_TYPE.INTERESTS;
  }
  if (
    normalizedTitle.includes("lifestyle") ||
    normalizedTitle.includes("obiettiv")
  ) {
    return IMAGE_BY_TYPE.LIFESTYLE;
  }
  if (normalizedTitle.includes("goal")) {
    return GOALS_IMAGE;
  }

  return DEFAULT_IMAGE;
};
