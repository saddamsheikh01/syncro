"use client";

import type { ButtonHTMLAttributes, HTMLAttributes } from "react";
import { cx } from "@/lib/classNames";

export type TagTone = "neutral" | "accent" | "success" | "warning" | "danger";

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: TagTone;
  onRemove?: () => void;
  removeLabel?: string;
}

const TONE_CLASSES: Record<TagTone, string> = {
  neutral: "border-border bg-surface text-foreground",
  accent: "border-accent/20 bg-accent-soft text-accent",
  success: "border-success/20 bg-success/10 text-success",
  warning: "border-warning/20 bg-warning/15 text-warning",
  danger: "border-danger/20 bg-danger/10 text-danger",
};

export const Tag = ({
  className,
  tone = "neutral",
  onRemove,
  removeLabel = "Rimuovi",
  children,
  ...props
}: TagProps) => (
  <span
    className={cx(
      "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
      TONE_CLASSES[tone],
      className
    )}
    {...props}
  >
    <span>{children}</span>
    {onRemove ? (
      <RemoveButton aria-label={removeLabel} onClick={onRemove} />
    ) : null}
  </span>
);

interface RemoveButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  className?: string;
}

const RemoveButton = ({ className, ...props }: RemoveButtonProps) => (
  <button
    type="button"
    className={cx(
      "inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[10px]",
      "text-subtle hover:border-border-strong hover:text-foreground",
      className
    )}
    {...props}
  >
    x
  </button>
);
