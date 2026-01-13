"use client";

import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";
import { cx } from "@/lib/classNames";

export interface PostActionButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  className?: string;
  label: string;
  count?: number;
  icon?: ReactNode;
  active?: boolean;
  onToggleState?: (nextActive: boolean) => void;
}

export const PostActionButton = ({
  className,
  label,
  count,
  icon,
  active,
  disabled,
  onClick,
  onToggleState,
  ...props
}: PostActionButtonProps) => {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    onToggleState?.(!active);
    onClick?.(event);
  };

  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={handleClick}
      className={cx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
        active
          ? "border-accent/30 bg-accent-soft text-accent"
          : "border-border bg-surface text-foreground",
        "hover:border-border-strong",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
      {...props}
    >
      {icon ? (
        <span className={cx("inline-flex", active ? "text-accent" : "text-subtle")}>
          {icon}
        </span>
      ) : null}
      <span>{label}</span>
      {typeof count === "number" ? (
        <span className={cx("text-xs", active ? "text-accent" : "text-subtle")}>
          {count}
        </span>
      ) : null}
    </button>
  );
};
