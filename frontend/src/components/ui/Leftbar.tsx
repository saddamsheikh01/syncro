"use client";

import type { HTMLAttributes } from "react";
import { cx } from "@/lib/classNames";
import { Menu } from "@/components/ui/Menu";

const CollapseIcon = ({ collapsed }: { collapsed: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
    aria-hidden="true"
  >
    {collapsed ? <path d="M9 6l6 6-6 6" /> : <path d="M15 6l-6 6 6 6" />}
  </svg>
);

export interface LeftbarProps extends HTMLAttributes<HTMLElement> {
  collapsed?: boolean;
  onCollapse?: (value: boolean) => void;
  position?: "fixed" | "absolute";
}

export const Leftbar = ({
  className,
  collapsed = false,
  onCollapse,
  position = "fixed",
  ...props
}: LeftbarProps) => (
  <aside
    className={cx(
      position,
      "left-4 top-4 bottom-4 z-40 flex flex-col rounded-[var(--radius-xl)] border border-border/70 bg-surface shadow-md",
      collapsed ? "w-20" : "w-72",
      className
    )}
    {...props}
  >
    <div className="flex h-full flex-col gap-5 p-4">
      <div
        className={cx(
          "flex items-center gap-3 rounded-[var(--radius-lg)] bg-surface-muted p-3",
          collapsed && "justify-center"
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-accent text-sm font-semibold text-accent-contrast shadow-sm">
          SY
        </div>
        <div className={cx("min-w-0", collapsed && "sr-only")}>
          <p className="text-sm font-semibold text-foreground">Syncro</p>
          <p className="text-xs text-subtle">Smart connections, real energy</p>
        </div>
      </div>

      <Menu className="flex-1 overflow-y-auto pr-1" collapsed={collapsed} />

      {/* Collapse disabilitato temporaneamente. */}
      {/*
      <button
        type="button"
        className={cx(
          "flex items-center gap-2 rounded-full border border-border bg-surface-muted px-3 py-2 text-xs font-semibold text-muted transition hover:border-border-strong hover:text-foreground",
          collapsed && "justify-center px-2"
        )}
        onClick={() => onCollapse?.(!collapsed)}
        aria-label={collapsed ? "Espandi barra laterale" : "Riduci barra laterale"}
      >
        <CollapseIcon collapsed={collapsed} />
        <span className={collapsed ? "sr-only" : "block"}>
          {collapsed ? "Espandi" : "Riduci"}
        </span>
      </button>
      */}
    </div>
  </aside>
);
