"use client";

import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";
import { cx } from "@/lib/classNames";
import { formatInterestLabel } from "@/lib/interestEmoji";

export interface InterestOptionCardProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  className?: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  selected?: boolean;
  onToggleState?: (nextSelected: boolean) => void;
}

export const InterestOptionCard = ({
  className,
  label,
  description,
  icon,
  selected,
  disabled,
  onClick,
  onToggleState,
  ...props
}: InterestOptionCardProps) => {
  const displayLabel = formatInterestLabel(label);
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
        "flex w-full items-center gap-3 rounded-[var(--radius-lg)] border px-4 py-3 text-left shadow-sm transition",
        selected
          ? "border-accent/30 bg-accent-soft text-accent-strong"
          : "border-border/70 bg-surface text-foreground",
        "hover:border-border-strong hover:bg-surface-muted/70",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
      {...props}
    >
      {icon ? (
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-foreground shadow-sm">
          {icon}
        </span>
      ) : null}
      <span className="space-y-1">
        <span className="block text-sm font-semibold">{displayLabel}</span>
        {description ? (
          <span className="block text-xs text-subtle">{description}</span>
        ) : null}
      </span>
    </button>
  );
};
