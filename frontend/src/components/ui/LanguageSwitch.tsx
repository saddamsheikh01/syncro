"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Dropdown } from "@/components/ui/Dropdown";
import { useAdminAuth, useAuth, useI18n, useT } from "@/hooks";
import { type SupportedLocale } from "@/i18n/locales";
import { FlagIcon } from "@/components/ui/FlagIcon";
import { cx } from "@/lib/classNames";

export interface LanguageSwitchProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  variant?: "compact" | "full" | "expat";
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
        prefix: <FlagIcon locale={id} size={18} />,
      })),
    [t]
  );

  let label: ReactNode;
  if (variant === "expat") {
    label = (
      <span aria-hidden>
        <FlagIcon locale={locale} size={24} />
      </span>
    );
  } else if (variant === "compact") {
    label = (
      <span className="flex items-center gap-1.5">
        <FlagIcon locale={locale} size={18} />
        <span>{locale.toUpperCase()}</span>
      </span>
    );
  } else {
    label = (
      <span className="flex items-center gap-2">
        <FlagIcon locale={locale} size={20} />
        {t("Language")}
      </span>
    );
  }

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
          await i18nActions.syncLanguage(next).catch(() => undefined);
          router.refresh();
        }}
        buttonClassName={cx(
          variant === "compact" && "px-3 py-2 text-[11px] font-bold tracking-wider",
          variant === "expat" &&
            "!rounded-lg !border-0 !bg-transparent !px-1 !py-0 !shadow-none min-h-0 gap-2 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-[#333]"
        )}
      />
    </div>
  );
};
