"use client";

import { useMemo, useState } from "react";
import type { HTMLAttributes } from "react";
import { Card } from "@/components/elements/Card";
import { DatePicker } from "@/components/elements/DatePicker";
import { TimePicker } from "@/components/elements/TimePicker";
import { useT } from "@/hooks";
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
  title = "Birth date and time",
  subtitle = "To refine Zyra profiling.",
  hint,
  value,
  defaultValue,
  onValueChange,
  dateLabel = "Date of birth",
  timeLabel = "Time of birth (optional)",
  required,
  disabled,
  ...props
}: BirthDateTimeFieldProps) => {
  const { t } = useT();
  const isControlled = value !== undefined;
  const resolvedTitle = t(title);
  const resolvedSubtitle = subtitle ? t(subtitle) : null;
  const resolvedDateLabel = t(dateLabel);
  const resolvedTimeLabel = t(timeLabel);
  const resolvedHint = hint ? t(hint) : null;
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
        <h4 className="text-base font-semibold text-foreground">{resolvedTitle}</h4>
        {resolvedSubtitle ? (
          <p className="text-sm text-muted">{resolvedSubtitle}</p>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <DatePicker
          label={resolvedDateLabel}
          value={currentValue.date}
          required={required}
          disabled={disabled}
          onValueChange={(date) => updateValue({ date })}
          maxYear={new Date().getFullYear()}
        />
        <TimePicker
          label={resolvedTimeLabel}
          value={currentValue.time}
          disabled={disabled}
          onValueChange={(time) => updateValue({ time })}
          startHour={0}
          endHour={23}
          stepMinutes={15}
        />
      </div>
      {resolvedHint ? <p className="text-xs text-subtle">{resolvedHint}</p> : null}
    </Card>
  );
};
