"use client";

import { createContext, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { useUserStore } from "@/stores/user/useUserStore";
import { userActions, userStore } from "@/stores/user/userStore";
import { DICTIONARIES } from "./dictionaries";
import {
  DEFAULT_LOCALE,
  normalizeLocale,
  type SupportedLocale,
} from "./locales";
import { setLocaleCookie, getLocaleCookie } from "./cookies";
import { createTranslator } from "./translator";

export type I18nContextValue = {
  locale: SupportedLocale;
  t: (key: string, values?: Record<string, string | number>) => string;
};

export const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  t: (key) => key,
});

export interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: string | null;
}

export const I18nProvider = ({ children, initialLocale }: I18nProviderProps) => {
  const storeLanguage = useUserStore((state) => state.language);

  // Bootstrap language in the store (single source of truth) as early as possible.
  useEffect(() => {
    userActions.hydrateLanguage();

    const normalizedStore = normalizeLocale(userStore.getState().language);
    if (normalizedStore) {
      setLocaleCookie(normalizedStore);
      return;
    }

    const cookieLocale = normalizeLocale(getLocaleCookie());
    if (cookieLocale) {
      userActions.setLanguage(cookieLocale);
      return;
    }

    const normalizedInitial = normalizeLocale(initialLocale);
    if (normalizedInitial) {
      userActions.setLanguage(normalizedInitial);
      return;
    }

    // Default (English) for new sessions.
    userActions.setLanguage(DEFAULT_LOCALE);
  }, [initialLocale]);

  const locale = useMemo<SupportedLocale>(() => {
    return (
      normalizeLocale(storeLanguage) ??
      normalizeLocale(initialLocale) ??
      DEFAULT_LOCALE
    );
  }, [initialLocale, storeLanguage]);

  const value = useMemo<I18nContextValue>(() => {
    const messages = DICTIONARIES[locale];
    const fallbackMessages = DICTIONARIES[DEFAULT_LOCALE];

    const { t } = createTranslator({
      messages,
      fallbackMessages,
      onMissingKey:
        process.env.NODE_ENV === "production" || locale === DEFAULT_LOCALE
          ? undefined
          : (key) => console.warn(`[i18n] Missing key: ${key}`),
    });

    return { locale, t };
  }, [locale]);

  useEffect(() => {
    setLocaleCookie(locale);
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};
