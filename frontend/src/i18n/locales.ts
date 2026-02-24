export const SUPPORTED_LOCALES = ["en", "it", "es", "fr", "sq", "pt"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = "en";

export const LOCALE_COOKIE_KEY = "syncro.locale";

export const normalizeLocale = (raw: unknown): SupportedLocale | null => {
  if (!raw) return null;
  if (typeof raw !== "string") return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Accept "en-US" etc., normalize to primary language subtag.
  const primary = trimmed.split(/[-_]/)[0]?.toLowerCase();
  if (!primary) return null;

  return (SUPPORTED_LOCALES as readonly string[]).includes(primary)
    ? (primary as SupportedLocale)
    : null;
};

export const toBcp47 = (locale: SupportedLocale): string => {
  switch (locale) {
    case "en":
      return "en-US";
    case "it":
      return "it-IT";
    case "es":
      return "es-ES";
    case "fr":
      return "fr-FR";
    case "sq":
      return "sq-AL";
    case "pt":
      return "pt-PT";
  }
};

