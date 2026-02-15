"use client";

import type { ButtonHTMLAttributes, MouseEvent } from "react";
import { useT } from "@/hooks";
import { cx } from "@/lib/classNames";

export interface TranslationToggleProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  className?: string;
  active?: boolean;
  label?: string;
  activeLabel?: string;
  inactiveLabel?: string;
  onToggleState?: (nextActive: boolean) => void;
}

export const TranslationToggle = ({
  className,
  active,
  label = "Translation",
  activeLabel = "Enabled",
  inactiveLabel = "Original",
  disabled,
  onClick,
  onToggleState,
  ...props
}: TranslationToggleProps) => {
  const { t } = useT();
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    onToggleState?.(!active);
    onClick?.(event);
  };
  const resolvedLabel = t(label);
  const resolvedStatusLabel = t(active ? activeLabel : inactiveLabel);

  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={handleClick}
      className={cx(
        "inline-flex items-center gap-3 rounded-full border border-border bg-surface px-3 py-2 text-left transition",
        "hover:border-border-strong",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
      {...props}
    >
      <span
        className={cx(
          "relative inline-flex h-5 w-9 items-center rounded-full border border-border bg-border/70 transition",
          active && "border-accent/30 bg-accent"
        )}
      >
        <span
          className={cx(
            "h-3.5 w-3.5 translate-x-1 rounded-full bg-surface shadow-sm transition",
            active && "translate-x-4"
          )}
        />
      </span>
      <span className="space-y-0.5">
        <span className="block text-[11px] font-semibold text-subtle">
          {resolvedLabel}
        </span>
        <span className="block text-xs font-semibold text-foreground">
          {resolvedStatusLabel}
        </span>
      </span>
    </button>
  );
};
