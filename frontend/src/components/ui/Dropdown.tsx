"use client";

import { useEffect, useRef, useState } from "react";
import type { HTMLAttributes } from "react";
import { cx } from "@/lib/classNames";

export interface DropdownItem {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface DropdownProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  label: string;
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
        aria-label={buttonAriaLabel ?? label}
        aria-expanded={open}
        disabled={disabled}
        onClick={handleToggle}
        className={cx(
          "inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground shadow-sm",
          "disabled:cursor-not-allowed disabled:opacity-60",
          buttonClassName
        )}
      >
        {label}
        <span className="text-subtle">v</span>
      </button>
      {open ? (
        <div
          className={cx(
            "absolute z-10 mt-2 min-w-[220px] rounded-[var(--radius-md)] border border-border bg-card p-2 shadow-lg",
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
                "flex w-full flex-col items-start gap-1 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm",
                "text-foreground hover:bg-surface-muted",
                item.disabled && "cursor-not-allowed text-subtle"
              )}
            >
              <span className="font-semibold">{item.label}</span>
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
