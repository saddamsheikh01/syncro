"use client";

import { Select } from "@/components/elements/Select";
import type { SelectOption } from "@/components/elements/Select";
import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";

export interface LanguagePickerProps {
  className?: string;
  label?: string;
  description?: string;
  value?: string;
  defaultValue?: string;
  options?: SelectOption[];
  onValueChange?: (value: string) => void;
}

const DEFAULT_OPTIONS: SelectOption[] = [
  { value: "it", label: "Italiano" },
  { value: "en", label: "English" },
  { value: "es", label: "Espanol" },
];

export const LanguagePicker = ({
  className,
  label = "Language",
  description = "Select the interface language.",
  value,
  defaultValue = "it",
  options = DEFAULT_OPTIONS,
  onValueChange,
}: LanguagePickerProps) => (
  <Card className={cx("space-y-3 p-5", className)}>
    <div className="space-y-1">
      <h4 className="text-base font-semibold text-foreground">{label}</h4>
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
