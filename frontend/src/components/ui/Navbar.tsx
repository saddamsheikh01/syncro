"use client";

import type { HTMLAttributes } from "react";
import { Card } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Avatar } from "@/components/elements/Avatar";
import { cx } from "@/lib/classNames";
import { NavIcon } from "@/components/ui/NavIcon";
import type { NavIconName } from "@/components/ui/NavIcon";

type NavbarAction = {
  id: string;
  label: string;
  icon: NavIconName;
  count?: number;
};

const NAV_ACTIONS: NavbarAction[] = [
  { id: "profile", label: "Profilo", icon: "user" },
  { id: "notifications", label: "Notifiche", icon: "bell", count: 5 },
  { id: "tests", label: "Test", icon: "clipboard", count: 3 },
];

export interface NavbarProps extends HTMLAttributes<HTMLElement> {
  position?: "fixed" | "absolute";
}

export const Navbar = ({
  className,
  position = "fixed",
  ...props
}: NavbarProps) => (
  <header
    className={cx(
      position,
      "left-80 right-6 top-4 z-30",
      className
    )}
    {...props}
  >
    <Card className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-[220px] items-center gap-3">
          <Avatar name="Zyra" size="sm" />
          <div className="space-y-1">
            <p className="text-xs text-subtle">
              Sono Zyra, il tuo giorno inizia qui.
            </p>
            <p className="text-sm font-semibold text-foreground">
              Da cosa vuoi partire?
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {NAV_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              className="group flex flex-col items-center gap-1 text-[11px] font-semibold text-subtle"
              aria-label={action.label}
            >
              <span className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-foreground shadow-sm transition group-hover:border-border-strong group-hover:text-foreground">
                <NavIcon name={action.icon} className="h-5 w-5" />
                {action.count ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-contrast shadow-sm">
                    {action.count}
                  </span>
                ) : null}
              </span>
              <span className="group-hover:text-foreground">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="max-w-2xl">
        <Input
          className="h-10"
          placeholder="Cerca persone, luoghi, esperienze"
          leftSlot={<NavIcon name="search" className="h-4 w-4" />}
        />
      </div>
    </Card>
  </header>
);
