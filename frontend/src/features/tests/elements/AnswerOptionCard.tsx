"use client";

import type { ButtonHTMLAttributes, MouseEvent } from "react";
import { cx } from "@/lib/classNames";

export interface AnswerOptionCardProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  className?: string;
  label: string;
  description?: string;
  selected?: boolean;
  onToggleState?: (nextSelected: boolean) => void;
}

export const AnswerOptionCard = ({
  className,
  label,
  description,
  selected,
  disabled,
  onClick,
  onToggleState,
  ...props
}: AnswerOptionCardProps) => {
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
        "flex w-full flex-col gap-3 rounded-[var(--radius-md)] border px-4 py-4 text-left transition",
        selected
          ? "border-accent/30 bg-accent-soft"
          : "border-border bg-card",
        "hover:border-border-strong",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <span
          className={cx(
            "inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold",
            selected
              ? "border-accent/30 bg-accent text-accent-contrast"
              : "border-border bg-surface text-subtle"
          )}
        >
          {selected ? "OK" : ""}
        </span>
      </div>
      {description ? (
        <span className="text-xs text-subtle">{description}</span>
      ) : null}
    </button>
  );
};
