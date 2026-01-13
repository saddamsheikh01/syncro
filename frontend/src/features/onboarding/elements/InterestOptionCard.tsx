"use client";

import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";
import { cx } from "@/lib/classNames";

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
        "flex w-full flex-col gap-2 rounded-[var(--radius-lg)] border px-3 py-3 text-left transition",
        selected
          ? "border-accent/30 bg-accent-soft text-foreground"
          : "border-border bg-card text-foreground",
        "hover:border-border-strong",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
      {...props}
    >
      {icon ? (
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-surface-muted text-foreground">
          {icon}
        </span>
      ) : null}
      <span className="space-y-1">
        <span className="block text-sm font-semibold">{label}</span>
        {description ? (
          <span className="block text-xs text-subtle">{description}</span>
        ) : null}
      </span>
    </button>
  );
};
