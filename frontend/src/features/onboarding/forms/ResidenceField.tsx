"use client";

import { Input } from "@/components/elements/Input";
import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";
import { useT } from "@/hooks";

export interface ResidenceFieldProps {
  className?: string;
  title?: string;
  description?: string;
  cityValue?: string;
  countryValue?: string;
  onCityChange?: (value: string) => void;
  onCountryChange?: (value: string) => void;
}

export const ResidenceField = ({
  className,
  title,
  description,
  cityValue,
  countryValue,
  onCityChange,
  onCountryChange,
}: ResidenceFieldProps) => {
  const { t } = useT();

  const resolvedTitle = title ?? t("onboarding.residence.title");
  const resolvedDescription =
    description ?? t("onboarding.residence.description");

  return (
    <Card className={cx("space-y-4 p-5", className)}>
      <div className="space-y-1">
        <h4 className="text-base font-semibold text-foreground">
          {resolvedTitle}
        </h4>
        <p className="text-sm text-muted">{resolvedDescription}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label={t("onboarding.residence.cityLabel")}
          value={cityValue}
          placeholder={t("onboarding.residence.cityPlaceholder")}
          onChange={(event) => onCityChange?.(event.target.value)}
        />
        <Input
          label={t("onboarding.residence.countryLabel")}
          value={countryValue}
          placeholder={t("onboarding.residence.countryPlaceholder")}
          onChange={(event) => onCountryChange?.(event.target.value)}
        />
      </div>
    </Card>
  );
};
