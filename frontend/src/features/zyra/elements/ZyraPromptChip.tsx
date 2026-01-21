"use client";

import type { ButtonHTMLAttributes, MouseEvent } from "react";
import { cx } from "@/lib/classNames";

export interface ZyraPromptChipProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  className?: string;
  label: string;
  selected?: boolean;
  onToggleState?: (nextSelected: boolean) => void;
}

export const ZyraPromptChip = ({
  className,
  label,
  selected,
  disabled,
  onClick,
  onToggleState,
  ...props
}: ZyraPromptChipProps) => {
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
          ? "border-border-strong bg-surface-muted text-foreground"
          : "border-border bg-surface text-foreground hover:border-border-strong",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
      disabled={disabled}
      onClick={handleClick}
      {...props}
    >
      {label}
    </button>
  );
};
