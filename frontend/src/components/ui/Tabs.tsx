"use client";

import { useState } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/classNames";

export interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  items: TabItem[];
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export const Tabs = ({
  className,
  items,
  defaultValue,
  onValueChange,
  ...props
}: TabsProps) => {
  const initial = defaultValue ?? items[0]?.value ?? "";
  const [active, setActive] = useState(initial);

  const handleChange = (value: string, disabled?: boolean) => {
    if (disabled) return;
    setActive(value);
    onValueChange?.(value);
  };

  const activeItem = items.find((item) => item.value === active) ?? items[0];

  return (
    <div className={cx("space-y-4", className)} {...props}>
      <div className="flex flex-wrap gap-2 rounded-[var(--radius-md)] bg-surface-muted/70 p-2">
        {items.map((item) => {
          const isActive = item.value === active;
          return (
            <button
              key={item.value}
              type="button"
              disabled={item.disabled}
              onClick={() => handleChange(item.value, item.disabled)}
              className={cx(
                "rounded-[var(--radius-md)] px-4 py-2 text-sm font-semibold transition",
                isActive
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-subtle hover:text-foreground",
                item.disabled && "cursor-not-allowed text-subtle"
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="rounded-[var(--radius-md)] border border-border/70 bg-card p-4 shadow-sm">
        {activeItem?.content}
      </div>
    </div>
  );
};
