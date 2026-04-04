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

/** Regional flag emoji per supported UI locale (fallback for non-component contexts). */
export const LOCALE_FLAG_EMOJI: Record<SupportedLocale, string> = {
  en: "🇬🇧",
  it: "🇮🇹",
  es: "🇪🇸",
  fr: "🇫🇷",
  sq: "🇦🇱",
  pt: "🇵🇹",
};

/** ISO 3166-1 alpha-2 country codes mapped from locale (for flag-icons). */
export const LOCALE_COUNTRY_CODE: Record<SupportedLocale, string> = {
  en: "GB",
  it: "IT",
  es: "ES",
  fr: "FR",
  sq: "AL",
  pt: "PT",
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

