import { cookies } from "next/headers";
import { DICTIONARIES } from "./dictionaries";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_KEY,
  normalizeLocale,
  type SupportedLocale,
} from "./locales";
import { createTranslator } from "./translator";

export const getServerLocale = async (): Promise<SupportedLocale> => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_KEY)?.value ?? null;
  return normalizeLocale(cookieLocale) ?? DEFAULT_LOCALE;
};

export const getServerTranslator = async () => {
  const locale = await getServerLocale();
  const messages = DICTIONARIES[locale];
  const fallbackMessages = DICTIONARIES[DEFAULT_LOCALE];

  const { t } = createTranslator({
    messages,
    fallbackMessages,
  });

  return { locale, t };
};

