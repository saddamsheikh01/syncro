"use client";

import type { HTMLAttributes } from "react";
import { cx } from "@/lib/classNames";

export type ToastTone = "neutral" | "accent" | "success" | "warning" | "danger";

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  message?: string;
  tone?: ToastTone;
  onClose?: () => void;
}

const TONE_CLASSES: Record<ToastTone, string> = {
  neutral: "border-border bg-surface text-foreground",
  accent: "border-accent/20 bg-accent-soft text-accent",
  success: "border-success/20 bg-success/10 text-success",
  warning: "border-warning/20 bg-warning/15 text-warning",
  danger: "border-danger/20 bg-danger/10 text-danger",
};

export const Toast = ({
  className,
  title,
  message,
  tone = "neutral",
  onClose,
  ...props
}: ToastProps) => (
  <div
    className={cx(
      "flex items-start justify-between gap-4 rounded-[var(--radius-md)] border p-4 shadow-md",
      TONE_CLASSES[tone],
      className
    )}
    role="status"
    {...props}
  >
    <div className="space-y-1">
      <p className="text-sm font-semibold">{title}</p>
      {message ? <p className="text-xs text-subtle">{message}</p> : null}
    </div>
    {onClose ? (
      <button
        type="button"
        onClick={onClose}
        className="text-xs font-semibold text-subtle hover:text-foreground"
        aria-label="Chiudi"
      >
        x
      </button>
    ) : null}
  </div>
);
