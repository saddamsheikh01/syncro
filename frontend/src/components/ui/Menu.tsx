"use client";

import type { HTMLAttributes } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/classNames";
import { SidebarIcon } from "@/components/ui/SidebarIcon";
import type { SidebarIconName } from "@/components/ui/SidebarIcon";

type MenuItem = {
  id: string;
  label: string;
  href: string;
  icon: SidebarIconName;
};

const MENU_ITEMS: MenuItem[] = [
  { id: "home", label: "Home", href: "/home", icon: "home" },
  {
    id: "people",
    label: "People & Connections",
    href: "/matches",
    icon: "people",
  },
  {
    id: "places",
    label: "Places & Experiences",
    href: "/places",
    icon: "places",
  },
  { id: "moments", label: "Moments", href: "/moments", icon: "moments" },
  { id: "insights", label: "Insights", href: "/insights", icon: "insights" },
  { id: "zyra", label: "Zyra", href: "/zyra", icon: "zyra" },
  { id: "chat", label: "Conversations", href: "/chat", icon: "chat" },
  { id: "profile", label: "Profile", href: "/profile", icon: "profile" },
  { id: "settings", label: "Settings", href: "/settings", icon: "settings" },
  { id: "support", label: "Support", href: "/support", icon: "support" },
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

export interface MenuProps extends HTMLAttributes<HTMLElement> {
  collapsed?: boolean;
}

export const Menu = ({ className, collapsed = false, ...props }: MenuProps) => {
  const pathname = usePathname();

  return (
    <nav
      className={cx("space-y-2", className)}
      aria-label="Navigazione principale"
      {...props}
    >
      {MENU_ITEMS.map((item) => {
        const active = isItemActive(pathname, item.href);

        return (
          <Link
            key={item.id}
            href={item.href}
            className={cx(
              "group flex items-center gap-3 rounded-[var(--radius-xl)] px-3 py-2.5 text-sm font-semibold transition",
              active
                ? "bg-gradient-to-r from-[var(--accent-gradient-start)] to-[var(--accent-gradient-end)] text-white shadow-[0_12px_24px_var(--accent-glow)]"
                : "text-muted hover:bg-surface-muted hover:text-foreground",
              collapsed && "justify-center px-2",
            )}
            aria-current={active ? "page" : undefined}
            aria-label={item.label}
          >
            <span
              className={cx(
                "flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-white/90 shadow-sm transition",
                active
                  ? "border-white/70 bg-white"
                  : "bg-surface-muted/70 group-hover:border-border-strong",
              )}
            >
              <SidebarIcon name={item.icon} size={30} />
            </span>
            <span
              className={cx(
                collapsed ? "sr-only" : "truncate"
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
