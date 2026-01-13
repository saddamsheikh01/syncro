"use client";

import { useId, useMemo, useState } from "react";
import type { HTMLAttributes } from "react";
import { Dropdown } from "@/components/ui/Dropdown";
import { cx } from "@/lib/classNames";

const pad = (value: number) => value.toString().padStart(2, "0");

const buildTimeOptions = (
  startHour: number,
  endHour: number,
  stepMinutes: number
) => {
  const startSafe = Math.min(startHour, endHour);
  const endSafe = Math.max(startHour, endHour);
  const options: { hour: number; minute: number; label: string }[] = [];
  const start = Math.max(0, startSafe) * 60;
  const end = Math.min(23, endSafe) * 60;
  const step = Math.max(5, stepMinutes);

  for (let total = start; total <= end; total += step) {
    const hours = Math.floor(total / 60);
    const minutes = total % 60;
    const label = `${pad(hours)}:${pad(minutes)}`;
    options.push({ hour: hours, minute: minutes, label });
  }

  return options;
};

const parseTimeParts = (value?: string) => {
  if (!value) return undefined;
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return undefined;
  return { hour: hours, minute: minutes };
};

export interface TimePickerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "value" | "onChange"> {
  className?: string;
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  hourPlaceholder?: string;
  minutePlaceholder?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  startHour?: number;
  endHour?: number;
  stepMinutes?: number;
  disabled?: boolean;
  required?: boolean;
  name?: string;
}

export const TimePicker = ({
  className,
  label,
  hint,
  error,
  placeholder,
  hourPlaceholder = "HH",
  minutePlaceholder = "MM",
  value,
  defaultValue,
  onValueChange,
  startHour = 6,
  endHour = 23,
  stepMinutes = 30,
  disabled,
  required,
  name,
  id,
  ...props
}: TimePickerProps) => {
  const generatedId = useId();
  const baseId = id ?? generatedId;
  const options = useMemo(
    () => buildTimeOptions(startHour, endHour, stepMinutes),
    [startHour, endHour, stepMinutes]
  );
  const hourItems = useMemo(() => {
    const hours = new Set(options.map((option) => option.hour));
    return Array.from(hours)
      .sort((a, b) => a - b)
      .map((hour) => ({
        id: String(hour),
        label: pad(hour),
      }));
  }, [options]);
  const minuteItems = useMemo(() => {
    const minutes = new Set(options.map((option) => option.minute));
    return Array.from(minutes)
      .sort((a, b) => a - b)
      .map((minute) => ({
        id: String(minute),
        label: pad(minute),
      }));
  }, [options]);

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const selectedValue = isControlled ? value : internalValue;
  const selectedParts = parseTimeParts(selectedValue);
  const defaultHour = hourItems.length ? Number(hourItems[0].id) : 0;
  const defaultMinute = minuteItems.length ? Number(minuteItems[0].id) : 0;
  const hourLabel = selectedParts ? pad(selectedParts.hour) : hourPlaceholder;
  const minuteLabel = selectedParts ? pad(selectedParts.minute) : minutePlaceholder;
  const placeholderLabel = placeholder ?? `${hourPlaceholder}:${minutePlaceholder}`;

  const updateValue = (hour: number, minute: number) => {
    const nextValue = `${pad(hour)}:${pad(minute)}`;
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onValueChange?.(nextValue);
  };

  return (
    <div className={cx("space-y-2", className)} {...props}>
      {label ? (
        <label htmlFor={`${baseId}-hour`} className="text-sm font-medium text-foreground">
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </label>
      ) : null}
      <div
        className={cx(
          "flex h-11 items-center gap-2 rounded-[var(--radius-md)] border bg-surface px-3 shadow-sm",
          error ? "border-danger/40" : "border-border",
          disabled && "cursor-not-allowed text-subtle"
        )}
      >
        <Dropdown
          label={hourLabel}
          items={hourItems}
          onSelect={(hour) =>
            updateValue(Number(hour), selectedParts?.minute ?? defaultMinute)
          }
          disabled={disabled}
          buttonId={`${baseId}-hour`}
          buttonAriaLabel={label ?? placeholderLabel}
          buttonClassName={cx(
            "border-0 bg-transparent px-0 py-0 text-sm shadow-none",
            !selectedParts && "text-subtle"
          )}
          menuClassName="max-h-56 overflow-y-auto"
        />
        <span className="text-subtle">:</span>
        <Dropdown
          label={minuteLabel}
          items={minuteItems}
          onSelect={(minute) =>
            updateValue(selectedParts?.hour ?? defaultHour, Number(minute))
          }
          disabled={disabled}
          buttonId={`${baseId}-minute`}
          buttonAriaLabel={label ?? placeholderLabel}
          buttonClassName={cx(
            "border-0 bg-transparent px-0 py-0 text-sm shadow-none",
            !selectedParts && "text-subtle"
          )}
          menuClassName="max-h-56 overflow-y-auto"
        />
      </div>
      {name ? (
        <input type="hidden" name={name} value={selectedValue ?? ""} />
      ) : null}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-subtle">{hint}</p>
      ) : null}
    </div>
  );
};
