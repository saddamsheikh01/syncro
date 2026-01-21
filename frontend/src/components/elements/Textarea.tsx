"use client";

import { forwardRef, useId } from "react";
import type { ReactNode, TextareaHTMLAttributes } from "react";
import { cx } from "@/lib/classNames";

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {
  className?: string;
  containerClassName?: string;
  label?: string;
  hint?: string;
  error?: string;
  rightSlot?: ReactNode;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      hint,
      error,
      rightSlot,
      containerClassName,
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const textareaId = id ?? autoId;

    return (
      <div className="space-y-2">
        {label ? (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-foreground"
          >
            {label}
            {required ? <span className="text-danger"> *</span> : null}
          </label>
        ) : null}
        <div
          className={cx(
            "flex items-start gap-2 rounded-[var(--radius-md)] border bg-surface px-3 py-2 shadow-sm",
            error ? "border-danger/40" : "border-border",
            disabled && "bg-surface-muted text-subtle",
            containerClassName
          )}
        >
          <textarea
            id={textareaId}
            ref={ref}
            className={cx(
              "min-h-[120px] w-full resize-y bg-transparent text-sm text-foreground placeholder:text-subtle focus:outline-none",
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

Textarea.displayName = "Textarea";
