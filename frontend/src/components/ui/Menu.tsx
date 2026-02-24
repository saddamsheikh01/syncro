"use client";

import type { HTMLAttributes } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/classNames";
import { SidebarIcon } from "@/components/ui/SidebarIcon";
import type { SidebarIconName } from "@/components/ui/SidebarIcon";
import { useT } from "@/hooks";

export type MenuItem = {
  id: string;
  labelKey: string;
  href: string;
  icon: SidebarIconName;
};

export const MENU_ITEMS: MenuItem[] = [
  { id: "home", labelKey: "Home", href: "/home", icon: "home" },
  {
    id: "people",
    labelKey: "People & Connections",
    href: "/matches",
    icon: "people",
  },
  {
    id: "places",
    labelKey: "Places & Experiences",
    href: "/places",
    icon: "places",
  },
  { id: "moments", labelKey: "Moments", href: "/moments", icon: "moments" },
  { id: "insights", labelKey: "Insights", href: "/insights", icon: "insights" },
  { id: "zyra", labelKey: "Zyra", href: "/zyra", icon: "zyra" },
  { id: "chat", labelKey: "Conversations", href: "/chat", icon: "chat" },
  { id: "connections", labelKey: "Connection requests", href: "/connections", icon: "people" },
  { id: "profile", labelKey: "Profile", href: "/profile", icon: "profile" },
  { id: "settings", labelKey: "Settings", href: "/settings", icon: "settings" },
  { id: "support", labelKey: "Support", href: "/support", icon: "support" },
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
  onItemClick?: () => void;
  items?: MenuItem[];
}

export const Menu = ({
  className,
  collapsed = false,
  onItemClick,
  items,
  ...props
}: MenuProps) => {
  const pathname = usePathname();
  const { t } = useT();
  const menuItems = items ?? MENU_ITEMS;

  return (
    <nav
      className={cx("space-y-2", className)}
      aria-label={t("Main navigation")}
      {...props}
    >
      {menuItems.map((item) => {
        const active = isItemActive(pathname, item.href);
        const label = t(item.labelKey);

        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={onItemClick}
            className={cx(
              "group flex items-center gap-3 rounded-[var(--radius-xl)] px-3 py-2.5 text-sm font-semibold transition",
              active
                ? "bg-gradient-to-r from-[var(--accent-gradient-start)] to-[var(--accent-gradient-end)] text-white shadow-[0_12px_24px_var(--accent-glow)]"
                : "text-muted hover:bg-surface-muted hover:text-foreground",
              collapsed && "justify-center px-2",
            )}
            aria-current={active ? "page" : undefined}
            aria-label={label}
          >
            <span
              className={cx(
                "flex h-10 w-10 shrink-0 items-center justify-center transition",
                active && "drop-shadow-[0_8px_16px_rgba(255,255,255,0.35)]",
              )}
            >
              <SidebarIcon name={item.icon} size={36} />
            </span>
            <span
              className={cx(
                collapsed ? "sr-only" : "truncate"
              )}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
