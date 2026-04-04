"use client";

import type { ComponentType } from "react";
import GB from "country-flag-icons/react/3x2/GB";
import IT from "country-flag-icons/react/3x2/IT";
import ES from "country-flag-icons/react/3x2/ES";
import FR from "country-flag-icons/react/3x2/FR";
import AL from "country-flag-icons/react/3x2/AL";
import PT from "country-flag-icons/react/3x2/PT";
import type { SupportedLocale } from "@/i18n/locales";

type FlagComponent = ComponentType<{ title?: string; className?: string; style?: React.CSSProperties }>;

const FLAG_COMPONENTS: Record<string, FlagComponent> = {
  GB, IT, ES, FR, AL, PT,
};

const LOCALE_TO_COUNTRY: Record<SupportedLocale, string> = {
  en: "GB", it: "IT", es: "ES", fr: "FR", sq: "AL", pt: "PT",
};

interface FlagIconProps {
  locale: SupportedLocale;
  size?: number;
  className?: string;
}

export const FlagIcon = ({ locale, size = 20, className }: FlagIconProps) => {
  const code = LOCALE_TO_COUNTRY[locale];
  const Component = FLAG_COMPONENTS[code];
  if (!Component) return null;
  return (
    <Component
      className={className}
      style={{ width: size, height: size * 2 / 3, borderRadius: 2, display: "inline-block", verticalAlign: "middle" }}
    />
  );
};
