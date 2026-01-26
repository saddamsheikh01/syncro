"use client";

import type { HTMLAttributes } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/classNames";
import { NavIcon } from "@/components/ui/NavIcon";
import type { NavIconName } from "@/components/ui/NavIcon";
import { ZyraMark } from "@/features/zyra/elements/ZyraMark";

type MenuItem = {
  id: string;
  label: string;
  href: string;
  icon: NavIconName;
};

const MENU_ITEMS: MenuItem[] = [
  { id: "home", label: "Home", href: "/home", icon: "home" },
  { id: "map", label: "Mappa", href: "/map", icon: "map" },
  { id: "matchmaking", label: "Matchmaking", href: "/matches", icon: "spark" },
  { id: "feed", label: "Feed", href: "/feed", icon: "document" },
  { id: "chat", label: "Chat", href: "/chat", icon: "chat" },
  { id: "zyra", label: "Zyra", href: "/zyra", icon: "spark" },
  { id: "places", label: "Luoghi", href: "/places", icon: "map-pin" },
  { id: "favorites", label: "Preferiti", href: "/favorites", icon: "star" },
  { id: "tests", label: "Tests", href: "/tests", icon: "clipboard" },
  { id: "settings", label: "Impostazioni", href: "/settings", icon: "sliders" },
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
        const isZyra = item.id === "zyra";

        return (
          <Link
            key={item.id}
            href={item.href}
            className={cx(
              "group flex items-center gap-3 rounded-full px-3 py-2 text-sm font-semibold transition",
              active && !isZyra ? "bg-accent-soft text-accent" : null,
              !active && !isZyra
                ? "text-muted hover:bg-surface-muted hover:text-foreground"
                : null,
              isZyra && active
                ? "border border-zyra-border/70 bg-zyra-glow/50 text-zyra-text shadow-[0_0_20px_var(--zyra-glow)]"
                : null,
              isZyra && !active
                ? "text-zyra-text/80 hover:bg-zyra-glow/40 hover:text-zyra-text"
                : null,
              collapsed && "justify-center px-2",
            )}
            aria-current={active ? "page" : undefined}
            aria-label={item.label}
          >
            <span
              className={cx(
                "flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-foreground transition",
                !isZyra &&
                  (active
                    ? "border-accent/30 bg-accent-soft text-accent"
                    : "group-hover:border-border-strong"),
                isZyra && "border-transparent bg-transparent",
              )}
            >
              {isZyra ? (
                <ZyraMark size="sm" glow={active} />
              ) : (
                <NavIcon name={item.icon} className="h-5 w-5" />
              )}
            </span>
            <span
              className={cx(
                collapsed ? "sr-only" : "truncate",
                isZyra &&
                  "bg-gradient-to-r from-zyra-start via-zyra-mid to-zyra-end bg-clip-text text-transparent",
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
