import type { HTMLAttributes } from "react";
import { cx } from "@/lib/classNames";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: BadgeSize;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-foreground",
  accent: "bg-accent-soft text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/10 text-danger",
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: "px-2 py-1 text-[11px]",
  md: "px-3 py-1.5 text-xs",
};

export const Badge = ({
  className,
  tone = "neutral",
  size = "md",
  ...props
}: BadgeProps) => (
  <span
    className={cx(
      "inline-flex items-center gap-1 rounded-full font-semibold",
      TONE_CLASSES[tone],
      SIZE_CLASSES[size],
      className
    )}
    {...props}
  />
);
