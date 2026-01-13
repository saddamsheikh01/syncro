"use client";

import { forwardRef, useId } from "react";
import type { ReactNode, SelectHTMLAttributes } from "react";
import { cx } from "@/lib/classNames";

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "className"> {
  className?: string;
  label?: string;
  hint?: string;
  error?: string;
  rightSlot?: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      hint,
      error,
      rightSlot,
      id,
      disabled,
      required,
      children,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const selectId = id ?? autoId;

    return (
      <div className="space-y-2">
        {label ? (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-foreground"
          >
            {label}
            {required ? <span className="text-danger"> *</span> : null}
          </label>
        ) : null}
        <div
          className={cx(
            "flex items-center gap-2 rounded-[var(--radius-md)] border bg-surface px-3 shadow-sm",
            error ? "border-danger/40" : "border-border",
            disabled && "bg-surface-muted text-subtle"
          )}
        >
          <select
            id={selectId}
            ref={ref}
            className={cx(
              "h-11 w-full appearance-none bg-transparent text-sm text-foreground focus:outline-none",
              className
            )}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(error)}
            {...props}
          >
            {children}
          </select>
          {rightSlot ? (
            <span className="text-subtle">{rightSlot}</span>
          ) : (
            <span className="text-subtle">v</span>
          )}
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

Select.displayName = "Select";
