"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { HTMLAttributes } from "react";
import { Dropdown } from "@/components/ui/Dropdown";
import { useT } from "@/hooks";
import { cx } from "@/lib/classNames";

const pad = (value: number) => value.toString().padStart(2, "0");

const parseDateParts = (value?: string) => {
  if (!value) return undefined;
  const parts = value.split("-").map(Number);
  if (parts.length !== 3) return undefined;
  const [year, month, day] = parts;
  if (!year || !month || !day) return undefined;
  return { year, month: month - 1, day };
};

const toIsoDate = (year: number, month: number, day: number) =>
  `${year}-${pad(month + 1)}-${pad(day)}`;

export interface DatePickerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "value" | "onChange"> {
  className?: string;
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  minYear?: number;
  maxYear?: number;
  disabled?: boolean;
  required?: boolean;
  name?: string;
}

export const DatePicker = ({
  className,
  label,
  hint,
  error,
  placeholder,
  value,
  defaultValue,
  onValueChange,
  minYear,
  maxYear,
  disabled,
  required,
  name,
  id,
  ...props
}: DatePickerProps) => {
  const { t, locale } = useT();
  const generatedId = useId();
  const autoId = id ?? generatedId;
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const selectedValue = isControlled ? value : internalValue;
  const selectedParts = parseDateParts(selectedValue);
  const now = new Date();
  const baseYear = minYear ?? now.getFullYear() - 100;
  const limitYear = maxYear ?? now.getFullYear();
  const resolvedPlaceholder = placeholder ?? t("Select a date");
  const monthLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { month: "long" });
    return Array.from({ length: 12 }, (_, index) =>
      formatter.format(new Date(2020, index, 1))
    );
  }, [locale]);
  const weekDayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
    // 2020-06-01 e' lunedi': teniamo lunedi' come primo giorno, coerente col calendario.
    const base = new Date(Date.UTC(2020, 5, 1));
    return Array.from({ length: 7 }, (_, index) =>
      formatter.format(new Date(base.getTime() + index * 24 * 60 * 60 * 1000))
    );
  }, [locale]);
  const initialYear = selectedParts?.year ?? now.getFullYear();
  const initialMonth = selectedParts?.month ?? now.getMonth();
  const [viewYear, setViewYear] = useState(initialYear);
  const [viewMonth, setViewMonth] = useState(initialMonth);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!ref.current || !(event.target instanceof Node)) return;
      if (!ref.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (year: number, month: number, day: number) => {
    const nextValue = toIsoDate(year, month, day);
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onValueChange?.(nextValue);
    setOpen(false);
  };

  const handlePrevMonth = () => {
    if (!canPrev) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
      return;
    }
    setViewMonth((prev) => prev - 1);
  };

  const handleNextMonth = () => {
    if (!canNext) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
      return;
    }
    setViewMonth((prev) => prev + 1);
  };

  const toggleOpen = () => {
    if (disabled) return;
    if (!open) {
      const next = selectedParts ?? {
        year: now.getFullYear(),
        month: now.getMonth(),
        day: now.getDate(),
      };
      const clampedYear = Math.min(Math.max(next.year, baseYear), limitYear);
      const clampedMonth =
        clampedYear === baseYear
          ? Math.max(next.month, 0)
          : clampedYear === limitYear
            ? Math.min(next.month, 11)
            : next.month;
      setViewYear(clampedYear);
      setViewMonth(clampedMonth);
    }
    setOpen((prev) => !prev);
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const leadingBlanks = (firstDay + 6) % 7;
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  const canPrev = viewYear > baseYear || (viewYear === baseYear && viewMonth > 0);
  const canNext = viewYear < limitYear || (viewYear === limitYear && viewMonth < 11);

  const displayValue = selectedParts
    ? `${pad(selectedParts.day)}/${pad(selectedParts.month + 1)}/${selectedParts.year}`
    : "";

  const todayParts = parseDateParts(
    toIsoDate(now.getFullYear(), now.getMonth(), now.getDate())
  );

  const monthItems = monthLabels.map((month, index) => ({
    id: String(index),
    label: month,
  }));
  const yearItems = useMemo(() => {
    const items = [];
    for (let year = limitYear; year >= baseYear; year -= 1) {
      items.push({ id: String(year), label: String(year) });
    }
    return items;
  }, [baseYear, limitYear]);

  return (
    <div className={cx("space-y-2", className)} {...props} ref={ref}>
      {label ? (
        <label htmlFor={autoId} className="text-sm font-medium text-foreground">
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </label>
      ) : null}
      <button
        type="button"
        id={autoId}
        aria-expanded={open}
        disabled={disabled}
        onClick={toggleOpen}
        className={cx(
          "flex h-11 w-full items-center justify-between rounded-[var(--radius-md)] border bg-surface px-3 text-sm text-foreground shadow-sm",
          error ? "border-danger/40" : "border-border",
          disabled && "cursor-not-allowed text-subtle",
          !displayValue && "text-subtle"
        )}
      >
        <span>{displayValue || resolvedPlaceholder}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="h-4 w-4 text-subtle"
          fill="none"
        >
          <path
            d="M6 8l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open ? (
        <div className="relative">
          <div className="absolute z-20 mt-2 w-72 rounded-[var(--radius-lg)] border border-border bg-card p-3 shadow-lg">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className={cx(
                  "rounded-full border border-border px-2 py-1 text-xs",
                  !canPrev && "cursor-not-allowed text-subtle"
                )}
                disabled={!canPrev}
              >
                {t("Previous")}
              </button>
              <div className="flex items-center gap-2">
                <Dropdown
                  label={monthLabels[viewMonth]}
                  items={monthItems}
                  onSelect={(id) => setViewMonth(Number(id))}
                  buttonClassName="px-2 py-1 text-xs font-semibold"
                  menuClassName="max-h-56 overflow-y-auto"
                />
                <Dropdown
                  label={String(viewYear)}
                  items={yearItems}
                  onSelect={(id) => setViewYear(Number(id))}
                  buttonClassName="px-2 py-1 text-xs font-semibold"
                  menuClassName="max-h-56 overflow-y-auto"
                />
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                className={cx(
                  "rounded-full border border-border px-2 py-1 text-xs",
                  !canNext && "cursor-not-allowed text-subtle"
                )}
                disabled={!canNext}
              >
                {t("Next")}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] text-subtle">
              {weekDayLabels.map((day) => (
                <span key={day} className="py-1 font-semibold">
                  {day}
                </span>
              ))}
              {Array.from({ length: leadingBlanks }).map((_, index) => (
                <span key={`blank-${index}`} className="h-8" />
              ))}
              {days.map((day) => {
                const isSelected =
                  selectedParts?.year === viewYear &&
                  selectedParts?.month === viewMonth &&
                  selectedParts?.day === day;
                const isToday =
                  todayParts?.year === viewYear &&
                  todayParts?.month === viewMonth &&
                  todayParts?.day === day;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleSelect(viewYear, viewMonth, day)}
                    className={cx(
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs",
                      isSelected
                        ? "bg-accent text-accent-contrast"
                        : "text-foreground hover:bg-surface-muted",
                      isToday && !isSelected && "border border-accent/40"
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
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
