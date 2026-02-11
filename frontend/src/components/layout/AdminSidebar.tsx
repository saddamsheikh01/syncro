"use client";

import type { HTMLAttributes } from "react";
import Link from "next/link";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Logo } from "@/components/elements/Logo";
import { cx } from "@/lib/classNames";

export type AdminNavItem = {
  href: string;
  label: string;
  description: string;
};

export interface AdminSidebarProps extends HTMLAttributes<HTMLElement> {
  items: AdminNavItem[];
  pathname: string;
  variant?: "desktop" | "mobile";
  adminEmail?: string;
  onLogout?: () => void;
}

const isActiveLink = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

export const AdminSidebar = ({
  items,
  pathname,
  variant = "desktop",
  adminEmail,
  onLogout,
  className,
  ...props
}: AdminSidebarProps) => {
  const isDesktop = variant === "desktop";

  return (
    <aside
      className={cx(
        isDesktop
          ? "fixed left-4 top-4 bottom-4 w-64"
          : "w-full",
        className
      )}
      {...props}
    >
      <Card
        className={cx(
          "flex h-full flex-col gap-4 p-4",
          !isDesktop && "h-auto"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-accent-soft">
            <Logo width={28} className="h-auto w-7" priority />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Syncro Admin</p>
            <p className="text-xs text-subtle">Back office workspace</p>
          </div>
        </div>

        <nav
          className={cx(
            isDesktop
              ? "flex-1 space-y-2 overflow-y-auto pr-1"
              : "grid gap-2 sm:grid-cols-2"
          )}
          aria-label="Back office navigation"
        >
          {items.map((item) => {
            const active = isActiveLink(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  "group flex flex-col gap-1 rounded-[var(--radius-lg)] border px-3 py-3 transition",
                  active
                    ? "border-accent/30 bg-accent-soft text-foreground shadow-sm"
                    : "border-transparent text-muted hover:border-border/70 hover:bg-surface-muted/60"
                )}
                aria-current={active ? "page" : undefined}
              >
                <span className="text-sm font-semibold">{item.label}</span>
                <span className="text-xs text-subtle">{item.description}</span>
              </Link>
            );
          })}
        </nav>

        {isDesktop && adminEmail && onLogout ? (
          <div className="mt-auto space-y-3 rounded-[var(--radius-lg)] border border-border/70 bg-surface-muted/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
              Session
            </p>
            <p className="text-sm font-semibold text-foreground">{adminEmail}</p>
            <Button size="sm" variant="outline" fullWidth onClick={onLogout}>
              Log out
            </Button>
          </div>
        ) : null}
      </Card>
    </aside>
  );
};
