"use client";

import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";
import { cx } from "@/lib/classNames";

export type PostActionVariant = "default" | "like";

export interface PostActionButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  className?: string;
  label: string;
  count?: number;
  icon?: ReactNode;
  active?: boolean;
  variant?: PostActionVariant;
  onToggleState?: (nextActive: boolean) => void;
}

export const PostActionButton = ({
  className,
  label,
  count,
  icon,
  active,
  variant = "default",
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

  const isLike = variant === "like";

  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={handleClick}
      className={cx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200",
        active
          ? isLike
            ? "border-red-200 bg-red-50 text-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
            : "border-accent/30 bg-accent-soft text-accent"
          : "border-border bg-surface text-foreground hover:border-border-strong",
        isLike && !active && "hover:border-red-200 hover:text-red-400",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
      {...props}
    >
      {icon ? (
        <span
          className={cx(
            "inline-flex transition-transform duration-200",
            active
              ? isLike
                ? "scale-110 text-red-500 dark:text-red-400"
                : "text-accent"
              : "text-subtle",
            isLike && active && "[&>svg]:fill-current"
          )}
        >
          {icon}
        </span>
      ) : null}
      <span>{label}</span>
      {typeof count === "number" ? (
        <span
          className={cx(
            "text-xs tabular-nums",
            active ? (isLike ? "text-red-500 dark:text-red-400" : "text-accent") : "text-subtle"
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
};
