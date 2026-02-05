import type { HTMLAttributes } from "react";
import { cx } from "@/lib/classNames";

export type BadgeTone = "neutral" | "accent" | "success" | "success-light" | "caution" | "warning" | "danger";
export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: BadgeSize;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-muted",
  accent: "bg-accent-soft text-accent-strong",
  success: "bg-emerald-500/20 text-emerald-700",
  "success-light": "bg-green-400/20 text-green-700",
  caution: "bg-amber-400/20 text-amber-700",
  warning: "bg-orange-400/20 text-orange-700",
  danger: "bg-rose-500/20 text-rose-700",
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
