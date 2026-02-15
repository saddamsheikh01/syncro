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
import { useT } from "@/hooks";

type MobileNavItem = {
  id: string;
  labelKey: string;
  href: string;
  icon: SidebarIconName;
  isZyra?: boolean;
};

const MOBILE_ITEMS: MobileNavItem[] = [
  { id: "home", labelKey: "Home", href: "/home", icon: "home" },
  { id: "people", labelKey: "Match", href: "/matches", icon: "people" },
  { id: "insights", labelKey: "Insights", href: "/insights", icon: "insights" },
  { id: "profile", labelKey: "Profile", href: "/profile", icon: "profile" },
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
  const { t } = useT();
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
          aria-label={t("Mobile navigation")}
        >
          {MOBILE_ITEMS.map((item) => {
            const active = isItemActive(pathname, item.href);
            const label = t(item.labelKey);

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
                  aria-label={label}
                >
                  <ZyraMark size="xs" glow={active} />
                  <span
                    className={cx(
                      "bg-gradient-to-r from-zyra-start via-zyra-mid to-zyra-end bg-clip-text text-transparent",
                      !active && "opacity-70 group-hover:opacity-100"
                    )}
                  >
                    {label}
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
                aria-label={label}
              >
                <span
                  className={cx(
                    "flex h-10 w-10 items-center justify-center transition",
                    active
                      ? "drop-shadow-[0_8px_16px_rgba(255,255,255,0.35)]"
                      : "opacity-90"
                  )}
                >
                  <SidebarIcon name={item.icon} size={26} />
                </span>
                <span className={cx(active && "text-white")}>{label}</span>
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
          aria-label={t("Open menu")}
          aria-expanded={drawerOpen}
          aria-haspopup="dialog"
        >
          <span className="flex h-10 w-10 items-center justify-center">
            <SidebarIcon name="settings" size={26} />
          </span>
        </button>
      </div>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
};
