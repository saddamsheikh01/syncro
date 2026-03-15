"use client";

import type { HTMLAttributes } from "react";
import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Dropdown } from "@/components/ui/Dropdown";
import { useAdminAuth, useAuth, useI18n, useT } from "@/hooks";
import type { SupportedLocale } from "@/i18n/locales";
import { cx } from "@/lib/classNames";

export interface LanguageSwitchProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  variant?: "compact" | "full";
  align?: "left" | "right";
}

const LOCALE_LABEL_KEYS: Record<SupportedLocale, string> = {
  en: "English",
  it: "Italian",
  es: "Spanish",
  fr: "French",
  sq: "Albanian",
  pt: "Portuguese",
};

export const LanguageSwitch = ({
  className,
  variant = "compact",
  align = "right",
  ...props
}: LanguageSwitchProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale } = useT();
  const { isAuthenticated } = useAuth();
  const { isAuthenticated: isAdminAuthenticated } = useAdminAuth();
  const { actions: i18nActions } = useI18n();
  const isAdminArea = pathname?.startsWith("/admin") ?? false;

  const items = useMemo(
    () =>
      (Object.keys(LOCALE_LABEL_KEYS) as SupportedLocale[]).map((id) => ({
        id,
        label: t(LOCALE_LABEL_KEYS[id]),
      })),
    [t]
  );

  const label = variant === "compact" ? locale.toUpperCase() : t("Language");

  return (
    <div className={cx("shrink-0", className)} {...props}>
      <Dropdown
        label={label}
        align={align}
        buttonAriaLabel={t("Change language")}
        items={items}
        onSelect={async (next) => {
          i18nActions.setLanguage(next);
          if (isAdminArea) {
            if (!isAdminAuthenticated) return;
            await i18nActions.syncAdminLanguage(next).catch(() => undefined);
            router.refresh();
            return;
          }
          if (!isAuthenticated) {
            router.refresh();
            return;
          }
          // Await the sync so the locale cookie is set before the server re-renders.
          await i18nActions.syncLanguage(next).catch(() => undefined);
          router.refresh();
        }}
        buttonClassName={cx(
          variant === "compact" && "px-3 py-2 text-[11px] font-bold tracking-wider"
        )}
      />
    </div>
  );
};
