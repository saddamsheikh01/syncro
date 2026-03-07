import type { TestType } from "@/types/insights";

type TestCopy = {
  title: string;
  description?: string;
};

const normalize = (value: string) => value.trim().toLowerCase();

const DEFAULT_EN_COPY: Record<TestType, TestCopy> = {
  INTERESTS: {
    title: "Interests Test",
    description:
      "Discover what truly motivates you. Choose the cards that represent your top interests to build a personalized profile.",
  },
  LIFESTYLE: {
    title: "Lifestyle Test",
    description:
      "Explore your lifestyle through 15 questions about habits, social preferences, and how you organize your time.",
  },
  VALUES: {
    title: "Values Test",
    description:
      "Understand your core values through 20 questions about inclusivity, autonomy, and tradition.",
  },
  OBJECTIVES: {
    title: "Goals Test",
    description:
      "Identify your life goals through 15 questions about balance, stability, and growth.",
  },
  PSY: {
    title: "Psychology Test",
    description:
      "Discover your psychological profile through 15 questions about how you think, feel, and act.",
  },
  ASTRO: {
    title: "Birth Chart Test",
    description:
      "Enter your key signs to receive a symbolic astrology profile. Skip any data you don't know.",
  },
  OTHER: {
    title: "Insight",
    description: "Complete this insight to refine your profile.",
  },
};

/** Translation keys for insight titles and descriptions (use with t() for localized copy). */
export const INSIGHT_COPY_KEYS: Record<TestType, { titleKey: string; descriptionKey: string }> = {
  INTERESTS: {
    titleKey: DEFAULT_EN_COPY.INTERESTS.title,
    descriptionKey: DEFAULT_EN_COPY.INTERESTS.description!,
  },
  LIFESTYLE: {
    titleKey: DEFAULT_EN_COPY.LIFESTYLE.title,
    descriptionKey: DEFAULT_EN_COPY.LIFESTYLE.description!,
  },
  VALUES: {
    titleKey: DEFAULT_EN_COPY.VALUES.title,
    descriptionKey: DEFAULT_EN_COPY.VALUES.description!,
  },
  OBJECTIVES: {
    titleKey: DEFAULT_EN_COPY.OBJECTIVES.title,
    descriptionKey: DEFAULT_EN_COPY.OBJECTIVES.description!,
  },
  PSY: {
    titleKey: DEFAULT_EN_COPY.PSY.title,
    descriptionKey: DEFAULT_EN_COPY.PSY.description!,
  },
  ASTRO: {
    titleKey: DEFAULT_EN_COPY.ASTRO.title,
    descriptionKey: DEFAULT_EN_COPY.ASTRO.description!,
  },
  OTHER: {
    titleKey: DEFAULT_EN_COPY.OTHER.title,
    descriptionKey: DEFAULT_EN_COPY.OTHER.description!,
  },
};

const ITALIAN_TITLE_MAP: Record<string, TestCopy> = {
  "test interessi": DEFAULT_EN_COPY.INTERESTS,
  "test valori": DEFAULT_EN_COPY.VALUES,
  "test lifestyle": DEFAULT_EN_COPY.LIFESTYLE,
  "test obiettivi": DEFAULT_EN_COPY.OBJECTIVES,
  "test psicologico": DEFAULT_EN_COPY.PSY,
  "test tema natale": DEFAULT_EN_COPY.ASTRO,
  "test astrologico": DEFAULT_EN_COPY.ASTRO,
};

const ITALIAN_HINTS = [
  "scopri",
  "inserisci",
  "obiettivi",
  "interessi",
  "valori",
  "psicolog",
  "tema natale",
  "astrolog",
  "domande",
  "equilibrio",
  "stabilit",
  "espansione",
  "abitudini",
  "preferenze",
];

const looksItalian = (value?: string | null) => {
  if (!value) return false;
  const normalized = normalize(value);
  return ITALIAN_HINTS.some((hint) => normalized.includes(hint));
};

export const resolveTestCopy = ({
  title,
  description,
  testType,
}: {
  title: string;
  description?: string | null;
  testType?: TestType | null;
}): TestCopy => {
  const normalizedTitle = normalize(title);
  const mappedByTitle = ITALIAN_TITLE_MAP[normalizedTitle];
  if (mappedByTitle) return mappedByTitle;

  if ((looksItalian(title) || looksItalian(description)) && testType) {
    return DEFAULT_EN_COPY[testType] ?? { title, description: description ?? undefined };
  }

  return { title, description: description ?? undefined };
};
