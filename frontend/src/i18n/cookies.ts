"use client";

import { LOCALE_COOKIE_KEY } from "./locales";
import type { SupportedLocale } from "./locales";

export const getLocaleCookie = (): string | null => {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";").map((item) => item.trim());
  for (const cookie of cookies) {
    if (!cookie) continue;
    const [key, ...rest] = cookie.split("=");
    if (key === LOCALE_COOKIE_KEY) {
      return decodeURIComponent(rest.join("=") || "");
    }
  }
  return null;
};

export const setLocaleCookie = (locale: SupportedLocale): void => {
  if (typeof document === "undefined") return;
  const maxAgeSeconds = 60 * 60 * 24 * 365;
  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = `${LOCALE_COOKIE_KEY}=${encodeURIComponent(
    locale
  )}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure ? "; Secure" : ""}`;
};

