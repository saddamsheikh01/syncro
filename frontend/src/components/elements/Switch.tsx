"use client";

import { useId } from "react";
import type { InputHTMLAttributes } from "react";
import { cx } from "@/lib/classNames";

export interface SwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> {
  className?: string;
  label?: string;
  description?: string;
}

export const Switch = ({
  className,
  label,
  description,
  id,
  disabled,
  ...props
}: SwitchProps) => {
  const autoId = useId();
  const switchId = id ?? autoId;

  return (
    <label
      htmlFor={switchId}
      className={cx(
        "flex cursor-pointer items-center justify-between gap-4 rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3",
        disabled && "opacity-60",
        className
      )}
    >
      <span className="space-y-1">
        {label ? (
          <span className="block text-sm font-medium text-foreground">
            {label}
          </span>
        ) : null}
        {description ? (
          <span className="block text-xs text-subtle">{description}</span>
        ) : null}
      </span>
      <span className="relative inline-flex h-6 w-10 items-center">
        <input
          id={switchId}
          type="checkbox"
          className="peer sr-only"
          disabled={disabled}
          {...props}
        />
        <span className="absolute inset-0 rounded-full bg-border transition peer-checked:bg-accent" />
        <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-surface shadow-sm transition peer-checked:translate-x-4" />
      </span>
    </label>
  );
};
