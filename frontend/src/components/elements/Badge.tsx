import type { HTMLAttributes } from "react";
import { cx } from "@/lib/classNames";

export type BadgeTone = "neutral" | "accent" | "success" | "success-light" | "caution" | "warning" | "danger";
export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: BadgeSize;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-foreground",
  accent: "bg-accent-soft text-accent",
  success: "bg-emerald-600/15 text-emerald-600",
  "success-light": "bg-green-500/15 text-green-600",
  caution: "bg-yellow-500/15 text-yellow-600",
  warning: "bg-orange-500/15 text-orange-600",
  danger: "bg-red-500/15 text-red-600",
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: "px-2 py-1 text-[11px]",
  md: "px-3 py-1.5 text-xs",
  lg: "px-4 py-2 text-sm",
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
