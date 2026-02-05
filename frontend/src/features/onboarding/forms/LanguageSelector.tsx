"use client";

import { Select } from "@/components/elements/Select";
import type { SelectOption } from "@/components/elements/Select";
import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";

export interface LanguageSelectorProps {
  className?: string;
  title?: string;
  description?: string;
  value?: string;
  defaultValue?: string;
  options?: SelectOption[];
  onValueChange?: (value: string) => void;
}

const DEFAULT_OPTIONS: SelectOption[] = [
  { value: "it", label: "Italian" },
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
];

export const LanguageSelector = ({
  className,
  title = "Language",
  description = "Choose your preferred app language.",
  value,
  defaultValue = "en",
  options = DEFAULT_OPTIONS,
  onValueChange,
}: LanguageSelectorProps) => (
  <Card className={cx("space-y-3 p-5", className)}>
    <div className="space-y-1">
      <h4 className="text-base font-semibold text-foreground">{title}</h4>
      <p className="text-sm text-muted">{description}</p>
    </div>
    <Select
      options={options}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
    />
  </Card>
);
