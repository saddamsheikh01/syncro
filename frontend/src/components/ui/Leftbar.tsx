"use client";

import type { HTMLAttributes } from "react";
import { cx } from "@/lib/classNames";
import { Menu } from "@/components/ui/Menu";
import { Logo } from "@/components/elements/Logo";
import { Logout } from "@/components/buttons/Logout";
import { DevTools } from "@/components/ui/DevTools";

const LogoutIcon = () => (
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
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
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
      collapsed ? "w-20" : "w-64",
      className,
    )}
    {...props}
  >
    <div className="flex h-full flex-col gap-5 p-4">
      <div
        className={cx(
          "flex items-center justify-center",
          collapsed ? "h-16" : "h-28"
        )}
      >
        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white shadow-sm">
          <Logo width={104} className="h-auto w-[104px]" priority />
        </div>
      </div>

      <Menu className="flex-1 overflow-y-auto pr-1" collapsed={collapsed} />

      {/* Dev Tools (solo localhost) */}
      <DevTools collapsed={collapsed} />

      {/* Logout button */}
      <div
        className={cx(
          "border-t border-border/70 pt-4",
          collapsed && "flex justify-center",
        )}
      >
        {collapsed ? (
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-danger transition-colors hover:bg-danger/10"
            aria-label="Logout"
          >
            <LogoutIcon />
          </button>
        ) : (
          <Logout fullWidth size="sm" />
        )}
      </div>
    </div>
  </aside>
);
