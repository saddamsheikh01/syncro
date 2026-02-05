"use client";

import { Input } from "@/components/elements/Input";
import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";

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
  title = "Residence",
  description = "Tell us where you live for more accurate suggestions.",
  cityValue,
  countryValue,
  onCityChange,
  onCountryChange,
}: ResidenceFieldProps) => (
  <Card className={cx("space-y-4 p-5", className)}>
    <div className="space-y-1">
      <h4 className="text-base font-semibold text-foreground">{title}</h4>
      <p className="text-sm text-muted">{description}</p>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <Input
        label="City"
        value={cityValue}
        placeholder="Milan"
        onChange={(event) => onCityChange?.(event.target.value)}
      />
      <Input
        label="Country"
        value={countryValue}
        placeholder="Italy"
        onChange={(event) => onCountryChange?.(event.target.value)}
      />
    </div>
  </Card>
);
