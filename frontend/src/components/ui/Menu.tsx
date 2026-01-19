"use client";

import type { HTMLAttributes } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/classNames";
import { NavIcon } from "@/components/ui/NavIcon";
import type { NavIconName } from "@/components/ui/NavIcon";

type MenuItem = {
  id: string;
  label: string;
  href: string;
  icon: NavIconName;
};

const MENU_ITEMS: MenuItem[] = [
  { id: "home", label: "Home", href: "/home", icon: "home" },
  { id: "feed", label: "Feed", href: "/feed", icon: "document" },
  { id: "chat", label: "Chat", href: "/chat", icon: "chat" },
  { id: "zyra", label: "Zyra", href: "/zyra", icon: "spark" },
  { id: "map", label: "Mappa", href: "/map", icon: "map" },
  { id: "matchmaking", label: "Matchmaking", href: "/matches", icon: "spark" },
  { id: "lounges", label: "Syncro Lounges", href: "/lounges", icon: "spark" },
  { id: "ristoranti", label: "Ristoranti", href: "/places", icon: "spark" },
  {
    id: "esperienze",
    label: "Esperienze",
    href: "/experiences",
    icon: "spark",
  },
  { id: "favorites", label: "Preferiti", href: "/favorites", icon: "star" },
  { id: "living", label: "Syncro Living", href: "/living", icon: "home" },
  { id: "eventi", label: "Eventi", href: "/events", icon: "calendar" },
  {
    id: "professionisti",
    label: "Professionisti",
    href: "/professionisti",
    icon: "briefcase",
  },
  { id: "tasks", label: "Syncro Tasks", href: "/tasks", icon: "check" },
  { id: "wallet", label: "Syncro Wallet", href: "/wallet", icon: "wallet" },
  { id: "news", label: "News", href: "/news", icon: "document" },
  { id: "settings", label: "Impostazioni", href: "/settings", icon: "sliders" },
  { id: "tests", label: "Tests", href: "/tests", icon: "clipboard" },
  { id: "ui-test", label: "UI-test", href: "/test", icon: "clipboard" },
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
              "group flex items-center gap-3 rounded-full px-3 py-2 text-sm font-semibold transition",
              active
                ? "bg-accent-soft text-accent"
                : "text-muted hover:bg-surface-muted hover:text-foreground",
              collapsed && "justify-center px-2"
            )}
            aria-current={active ? "page" : undefined}
            aria-label={item.label}
          >
            <span
              className={cx(
                "flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-foreground transition",
                active
                  ? "border-accent/30 bg-accent-soft text-accent"
                  : "group-hover:border-border-strong"
              )}
            >
              <NavIcon name={item.icon} className="h-5 w-5" />
            </span>
            <span className={collapsed ? "sr-only" : "truncate"}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
