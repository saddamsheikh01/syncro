"use client";

import type { ButtonHTMLAttributes, MouseEvent } from "react";
import { cx } from "@/lib/classNames";

export interface AnswerOptionRowProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  className?: string;
  label: string;
  description?: string;
  indexLabel?: string;
  selected?: boolean;
  onToggleState?: (nextSelected: boolean) => void;
}

export const AnswerOptionRow = ({
  className,
  label,
  description,
  indexLabel,
  selected,
  disabled,
  onClick,
  onToggleState,
  ...props
}: AnswerOptionRowProps) => {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    onToggleState?.(!selected);
    onClick?.(event);
  };

  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={handleClick}
      className={cx(
        "flex w-full items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-left transition",
        selected
          ? "border-accent/30 bg-accent-soft"
          : "border-border/70 bg-surface",
        "hover:border-border-strong",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
      {...props}
    >
      <span
        className={cx(
          "inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold",
          selected
            ? "border-accent/30 bg-accent text-accent-contrast"
            : "border-border/70 bg-card text-subtle"
        )}
      >
        {indexLabel ?? (selected ? "v" : "")}
      </span>
      <span className="flex-1">
        <span className="block text-sm font-semibold text-foreground">
          {label}
        </span>
        {description ? (
          <span className="block text-xs text-subtle">{description}</span>
        ) : null}
      </span>
      {selected ? (
        <span className="text-xs font-semibold text-accent">Selezionata</span>
      ) : null}
    </button>
  );
};
