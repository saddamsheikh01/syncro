"use client";

import { useState } from "react";
import type { HTMLAttributes } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/classNames";
import { SidebarIcon } from "@/components/ui/SidebarIcon";
import type { SidebarIconName } from "@/components/ui/SidebarIcon";
import { ZyraMark } from "@/features/zyra/elements/ZyraMark";
import { MobileDrawer } from "@/components/ui/MobileDrawer";

type MobileNavItem = {
  id: string;
  label: string;
  href: string;
  icon: SidebarIconName;
  isZyra?: boolean;
};

const MOBILE_ITEMS: MobileNavItem[] = [
  { id: "home", label: "Home", href: "/home", icon: "home" },
  { id: "people", label: "Match", href: "/matches", icon: "people" },
  { id: "insights", label: "Insights", href: "/insights", icon: "insights" },
  { id: "profile", label: "Profile", href: "/profile", icon: "profile" },
];

const normalizePath = (path: string) =>
  path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;

const isItemActive = (pathname: string, href: string) => {
  const normalizedPath = normalizePath(pathname);
  const normalizedHref = normalizePath(href);
  return (
    normalizedPath === normalizedHref ||
    normalizedPath.startsWith(`${normalizedHref}/`)
  );
};

export interface MobileBarProps extends HTMLAttributes<HTMLElement> {
  position?: "fixed" | "absolute";
}

export const MobileBar = ({
  className,
  position = "fixed",
  ...props
}: MobileBarProps) => {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <div
        className={cx(position, "left-3 right-3 bottom-3 z-40 flex h-14 items-stretch gap-2", className)}
        {...props}
      >
        {/* Main navigation bar */}
        <nav
          className="flex flex-1 items-center justify-between rounded-[2rem] border border-border/70 bg-surface px-3 shadow-md"
          aria-label="Mobile navigation"
        >
          {MOBILE_ITEMS.map((item) => {
            const active = isItemActive(pathname, item.href);

            if (item.isZyra) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cx(
                    "group flex flex-col items-center gap-0.5 rounded-[var(--radius-lg)] px-3 py-1 text-[10px] font-semibold transition",
                    active
                      ? "text-zyra-text"
                      : "text-zyra-text/70 hover:text-zyra-text"
                  )}
                  aria-current={active ? "page" : undefined}
                  aria-label={item.label}
                >
                  <ZyraMark size="xs" glow={active} />
                  <span
                    className={cx(
                      "bg-gradient-to-r from-zyra-start via-zyra-mid to-zyra-end bg-clip-text text-transparent",
                      !active && "opacity-70 group-hover:opacity-100"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cx(
                  "flex flex-col items-center gap-0.5 rounded-[var(--radius-lg)] px-3 py-1 text-[10px] font-semibold transition",
                  active
                    ? "bg-gradient-to-r from-[var(--accent-gradient-start)] to-[var(--accent-gradient-end)] text-white shadow-[0_10px_20px_var(--accent-glow)]"
                    : "text-muted hover:bg-surface-muted hover:text-foreground"
                )}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
              >
                <span
                  className={cx(
                    "flex h-9 w-9 items-center justify-center rounded-2xl border border-border/70 transition",
                    active
                      ? "border-white/70 bg-white shadow-[0_10px_20px_var(--accent-glow)]"
                      : "bg-surface-muted/70 shadow-sm"
                  )}
                >
                  <SidebarIcon name={item.icon} size={22} />
                </span>
                <span className={cx(active && "text-white")}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Separate hamburger menu button */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className={cx(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border/70 bg-surface shadow-md transition",
            drawerOpen
              ? "border-accent/30 bg-accent-soft text-accent"
              : "text-muted hover:bg-surface-muted hover:text-foreground"
          )}
          aria-label="Apri menu"
          aria-expanded={drawerOpen}
          aria-haspopup="dialog"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-border/70 bg-surface-muted/70 shadow-sm">
            <SidebarIcon name="settings" size={22} />
          </span>
        </button>
      </div>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
};
