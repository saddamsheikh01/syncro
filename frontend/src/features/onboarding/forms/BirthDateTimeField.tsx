"use client";

import { useMemo, useState } from "react";
import type { HTMLAttributes } from "react";
import { Card } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { cx } from "@/lib/classNames";

export interface BirthDateTimeValue {
  date: string;
  time: string;
}

export interface BirthDateTimeFieldProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "defaultValue" | "value"> {
  className?: string;
  title?: string;
  subtitle?: string;
  hint?: string;
  value?: Partial<BirthDateTimeValue>;
  defaultValue?: Partial<BirthDateTimeValue>;
  onValueChange?: (value: BirthDateTimeValue) => void;
  dateLabel?: string;
  timeLabel?: string;
  required?: boolean;
  disabled?: boolean;
}

const EMPTY_VALUE: BirthDateTimeValue = {
  date: "",
  time: "",
};

export const BirthDateTimeField = ({
  className,
  title = "Data e ora di nascita",
  subtitle = "Per affinare la profilazione Zyra.",
  hint,
  value,
  defaultValue,
  onValueChange,
  dateLabel = "Data di nascita",
  timeLabel = "Ora di nascita (opzionale)",
  required,
  disabled,
  ...props
}: BirthDateTimeFieldProps) => {
  const isControlled = value !== undefined;
  const initialValue = useMemo(
    () => ({ ...EMPTY_VALUE, ...defaultValue, ...value }),
    [defaultValue, value]
  );
  const [internalValue, setInternalValue] = useState(initialValue);
  const currentValue = isControlled
    ? { ...EMPTY_VALUE, ...value }
    : internalValue;

  const updateValue = (next: Partial<BirthDateTimeValue>) => {
    const merged = { ...currentValue, ...next };
    if (!isControlled) {
      setInternalValue(merged);
    }
    onValueChange?.(merged);
  };

  return (
    <Card className={cx("space-y-4 p-5", className)} {...props}>
      <div className="space-y-1">
        <h4 className="text-base font-semibold text-foreground">{title}</h4>
        {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          type="date"
          label={dateLabel}
          value={currentValue.date}
          required={required}
          disabled={disabled}
          onChange={(event) => updateValue({ date: event.target.value })}
        />
        <Input
          type="time"
          label={timeLabel}
          value={currentValue.time}
          disabled={disabled}
          onChange={(event) => updateValue({ time: event.target.value })}
        />
      </div>
      {hint ? <p className="text-xs text-subtle">{hint}</p> : null}
    </Card>
  );
};
