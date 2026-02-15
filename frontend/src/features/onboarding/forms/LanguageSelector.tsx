"use client";

import { Select } from "@/components/elements/Select";
import type { SelectOption } from "@/components/elements/Select";
import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";
import { useT } from "@/hooks";

export interface LanguageSelectorProps {
  className?: string;
  title?: string;
  description?: string;
  value?: string;
  defaultValue?: string;
  options?: SelectOption[];
  onValueChange?: (value: string) => void;
}

export const LanguageSelector = ({
  className,
  title,
  description,
  value,
  defaultValue = "en",
  options,
  onValueChange,
}: LanguageSelectorProps) => {
  const { t } = useT();

  const resolvedTitle = title ?? t("onboarding.language.title");
  const resolvedDescription = description ?? t("onboarding.language.description");

  const resolvedOptions: SelectOption[] =
    options ?? [
      { value: "en", label: t("languages.en") },
      { value: "it", label: t("languages.it") },
      { value: "es", label: t("languages.es") },
      { value: "fr", label: t("languages.fr") },
    ];

  return (
    <Card className={cx("space-y-3 p-5", className)}>
      <div className="space-y-1">
        <h4 className="text-base font-semibold text-foreground">
          {resolvedTitle}
        </h4>
        <p className="text-sm text-muted">{resolvedDescription}</p>
      </div>
      <Select
        options={resolvedOptions}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
      />
    </Card>
  );
};
