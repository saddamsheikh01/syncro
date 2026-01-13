"use client";

import type { ButtonHTMLAttributes, MouseEvent } from "react";
import { cx } from "@/lib/classNames";

export interface VisibilityOptionChipProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  className?: string;
  label: string;
  description?: string;
  selected?: boolean;
  onToggleState?: (nextSelected: boolean) => void;
}

export const VisibilityOptionChip = ({
  className,
  label,
  description,
  selected,
  disabled,
  onClick,
  onToggleState,
  ...props
}: VisibilityOptionChipProps) => {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    onToggleState?.(!selected);
    onClick?.(event);
  };

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={handleClick}
      disabled={disabled}
      className={cx(
        "flex w-full items-start gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-left transition",
        selected
          ? "border-accent/30 bg-accent-soft text-accent"
          : "border-border bg-surface text-foreground",
        "hover:border-border-strong",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
    >
      <div className="space-y-1">
        <p className="text-sm font-semibold">{label}</p>
        {description ? (
          <p className="text-xs text-subtle">{description}</p>
        ) : null}
      </div>
    </button>
  );
};
