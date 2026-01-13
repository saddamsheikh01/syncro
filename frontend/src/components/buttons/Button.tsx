"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/classNames";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
  loadingText?: string;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-contrast shadow-md hover:brightness-95 focus-visible:ring-2 focus-visible:ring-accent/30",
  secondary:
    "bg-surface text-foreground border border-border shadow-sm hover:border-border-strong",
  outline:
    "border border-border-strong text-foreground hover:bg-surface-muted",
  ghost: "text-foreground hover:bg-surface-muted",
  danger:
    "bg-danger text-white shadow-md hover:brightness-95 focus-visible:ring-2 focus-visible:ring-danger/30",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export const Button = ({
  className,
  variant = "primary",
  size = "md",
  fullWidth,
  leftIcon,
  rightIcon,
  loading,
  loadingText,
  disabled,
  children,
  ...props
}: ButtonProps) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-semibold transition",
        "focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && "w-full",
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
          <span>{loadingText ?? "Caricamento"}</span>
        </span>
      ) : (
        <>
          {leftIcon ? <span className="inline-flex">{leftIcon}</span> : null}
          <span>{children}</span>
          {rightIcon ? <span className="inline-flex">{rightIcon}</span> : null}
        </>
      )}
    </button>
  );
};
