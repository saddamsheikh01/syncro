"use client";

import { useEffect, useRef, useState } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/classNames";

export interface DropdownItem {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
  /** Shown before the label (e.g. flag emoji). */
  prefix?: ReactNode;
}

export interface DropdownProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  label: ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
  onSelect?: (id: string) => void;
  disabled?: boolean;
  buttonId?: string;
  buttonAriaLabel?: string;
  buttonClassName?: string;
  menuClassName?: string;
}

export const Dropdown = ({
  className,
  label,
  items,
  align = "left",
  onSelect,
  disabled,
  buttonId,
  buttonAriaLabel,
  buttonClassName,
  menuClassName,
  ...props
}: DropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!ref.current || !(event.target instanceof Node)) return;
      if (!ref.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (itemId: string, itemDisabled?: boolean) => {
    if (itemDisabled) return;
    onSelect?.(itemId);
    setOpen(false);
  };

  const handleToggle = () => {
    if (disabled) return;
    setOpen((prev) => !prev);
  };

  return (
    <div ref={ref} className={cx("relative", className)} {...props}>
      <button
        type="button"
        id={buttonId}
        aria-label={
          buttonAriaLabel ??
          (typeof label === "string" || typeof label === "number" ? String(label) : "Menu")
        }
        aria-expanded={open}
        disabled={disabled}
        onClick={handleToggle}
        className={cx(
          "inline-flex items-center gap-2 rounded-full border border-border/70 bg-surface px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20",
          "disabled:cursor-not-allowed disabled:opacity-60",
          buttonClassName
        )}
      >
        {label}
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="h-4 w-4 text-subtle"
          fill="none"
        >
          <path
            d="M6 8l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open ? (
        <div
          className={cx(
            "absolute z-10 mt-2 min-w-[220px] rounded-[var(--radius-md)] border border-border/70 bg-card p-2 shadow-lg",
            align === "left" ? "left-0" : "right-0",
            menuClassName
          )}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id, item.disabled)}
              disabled={item.disabled}
              className={cx(
                "flex w-full flex-col items-start gap-1 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm transition-colors",
                "text-foreground hover:bg-surface-muted",
                item.disabled && "cursor-not-allowed text-subtle"
              )}
            >
              <span className="flex items-center gap-2 font-semibold">
                {item.prefix && <span className="shrink-0">{item.prefix}</span>}
                {item.label}
              </span>
              {item.description ? (
                <span className="text-xs text-subtle">{item.description}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};
