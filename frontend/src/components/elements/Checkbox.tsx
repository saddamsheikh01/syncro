"use client";

import { useId } from "react";
import type { InputHTMLAttributes } from "react";
import { cx } from "@/lib/classNames";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> {
  className?: string;
  label: string;
  description?: string;
}

export const Checkbox = ({
  className,
  label,
  description,
  id,
  disabled,
  ...props
}: CheckboxProps) => {
  const autoId = useId();
  const checkboxId = id ?? autoId;

  return (
    <div className={cx("flex items-start gap-3", className)}>
      <input
        id={checkboxId}
        type="checkbox"
        disabled={disabled}
        className={cx(
          "mt-1 h-4 w-4 rounded-[4px] border-border text-accent",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
          disabled && "opacity-60"
        )}
        {...props}
      />
      <div className="space-y-1">
        <label
          htmlFor={checkboxId}
          className="text-sm font-medium text-foreground"
        >
          {label}
        </label>
        {description ? (
          <p className="text-xs text-subtle">{description}</p>
        ) : null}
      </div>
    </div>
  );
};
