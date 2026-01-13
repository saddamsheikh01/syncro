"use client";

import type { HTMLAttributes } from "react";
import { cx } from "@/lib/classNames";
import { NavIcon } from "@/components/ui/NavIcon";
import type { NavIconName } from "@/components/ui/NavIcon";

type MobileNavItem = {
  id: string;
  label: string;
  icon: NavIconName;
  active?: boolean;
};

const MOBILE_ITEMS: MobileNavItem[] = [
  { id: "home", label: "Home", icon: "home", active: true },
  { id: "map", label: "Mappa", icon: "map" },
  { id: "matches", label: "Match", icon: "spark" },
  { id: "feed", label: "Feed", icon: "chat" },
  { id: "profile", label: "Profilo", icon: "user" },
];

export interface MobileBarProps extends HTMLAttributes<HTMLElement> {
  position?: "fixed" | "absolute";
}

export const MobileBar = ({
  className,
  position = "fixed",
  ...props
}: MobileBarProps) => (
  <nav
    className={cx(
      position,
      "left-4 right-4 bottom-4 z-40",
      className
    )}
    aria-label="Navigazione mobile"
    {...props}
  >
    <div className="flex items-center justify-between gap-2 rounded-[var(--radius-xl)] border border-border/60 bg-card px-3 py-2 shadow-lg backdrop-blur">
      {MOBILE_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={cx(
            "flex flex-1 flex-col items-center gap-1 rounded-[var(--radius-lg)] px-2 py-2 text-[11px] font-semibold transition",
            item.active
              ? "bg-accent-soft text-accent"
              : "text-subtle hover:bg-surface-muted hover:text-foreground"
          )}
          aria-current={item.active ? "page" : undefined}
          aria-label={item.label}
        >
          <NavIcon name={item.icon} className="h-5 w-5" />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  </nav>
);
