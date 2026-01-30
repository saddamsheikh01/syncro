"use client";

import type { ButtonHTMLAttributes, MouseEvent } from "react";
import { cx } from "@/lib/classNames";
import { formatInterestLabel } from "@/lib/interestEmoji";

export interface TagPillSelectableProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  className?: string;
  label: string;
  selected?: boolean;
  onToggleState?: (nextSelected: boolean) => void;
}

export const TagPillSelectable = ({
  className,
  label,
  selected,
  disabled,
  onClick,
  onToggleState,
  ...props
}: TagPillSelectableProps) => {
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
      className={cx(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition",
        selected
          ? "border-accent/20 bg-accent-soft text-accent"
          : "border-border bg-surface text-foreground",
        "hover:border-border-strong",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
      disabled={disabled}
      onClick={handleClick}
      {...props}
    >
      {displayLabel}
    </button>
  );
};
