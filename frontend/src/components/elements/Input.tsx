"use client";

import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/classNames";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  className?: string;
  label?: string;
  hint?: string;
  error?: string;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      hint,
      error,
      leftSlot,
      rightSlot,
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const inputId = id ?? autoId;

    return (
      <div className="space-y-2">
        {label ? (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-foreground"
          >
            {label}
            {required ? <span className="text-danger"> *</span> : null}
          </label>
        ) : null}
        <div
          className={cx(
            "flex items-center gap-2 rounded-[var(--radius-md)] border bg-surface px-3 shadow-sm transition-colors focus-within:border-accent/40 focus-within:ring-1 focus-within:ring-accent/20",
            error ? "border-danger/40 focus-within:border-danger/40 focus-within:ring-danger/20" : "border-border/70",
            disabled && "bg-surface-muted text-subtle"
          )}
        >
          {leftSlot ? <span className="text-subtle">{leftSlot}</span> : null}
          <input
            id={inputId}
            ref={ref}
            className={cx(
              "h-11 w-full bg-transparent text-sm text-foreground placeholder:text-subtle focus:outline-none",
              className
            )}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(error)}
            {...props}
          />
          {rightSlot ? <span className="text-subtle">{rightSlot}</span> : null}
        </div>
        {error ? (
          <p className="text-xs text-danger">{error}</p>
        ) : hint ? (
          <p className="text-xs text-subtle">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
