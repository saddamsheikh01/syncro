"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/classNames";
import { SidebarIcon } from "@/components/ui/SidebarIcon";
import type { SidebarIconName } from "@/components/ui/SidebarIcon";
import { useT } from "@/hooks";
import { useExpatsModeStore } from "@/stores/expatsMode/useExpatsModeStore";

export type MenuItem = {
  id: string;
  labelKey: string;
  href: string;
  /** Standard icon from the icon sprite. Ignored when `customIcon` is provided. */
  icon?: SidebarIconName;
  /** Inline SVG / React node used when there is no sprite entry for this item. */
  customIcon?: ReactNode;
};

export const MENU_ITEMS: MenuItem[] = [
  { id: "home", labelKey: "Home", href: "/home", icon: "home" },
  { id: "profile", labelKey: "Profile", href: "/profile", icon: "profile" },
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
  { id: "zyra", labelKey: "Zyra", href: "/zyra", icon: "zyra" },
  { id: "chat", labelKey: "Conversations", href: "/chat", icon: "chat" },
  { id: "connections", labelKey: "Connection requests", href: "/connections", icon: "people" },
  { id: "settings", labelKey: "Settings", href: "/settings", icon: "settings" },
  { id: "support", labelKey: "Support", href: "/support", icon: "support" },
];

/** Shown only when Expats Mode is active (sidebar section). */
export const EXPATS_MENU_ITEMS: MenuItem[] = [
  { id: "expats-activation", labelKey: "Activation Page", href: "/expats/activation", icon: "activation" },
  { id: "expats-subscription", labelKey: "Subscriptions", href: "/expats/subscriptions", icon: "subscriptions" },
  { id: "expats-kit", labelKey: "Expats Kit", href: "/expats/starter-kit", icon: "expats-kit" },
  { id: "expats-budget", labelKey: "Budget Simulator", href: "/expats/budget", icon: "budget-simulator" },
];

const normalizePath = (path: string) =>
  path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;

const isItemActive = (pathname: string, href: string) => {
  const normalizedPath = normalizePath(pathname);
  const baseHref = href.includes("#") ? href.split("#")[0] : href;
  const normalizedHref = normalizePath(baseHref);
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

const renderItem = (
  item: MenuItem,
  pathname: string,
  collapsed: boolean,
  t: (key: string) => string,
  onItemClick?: () => void
) => {
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
        {item.customIcon ?? (
          item.icon && <SidebarIcon name={item.icon} size={36} />
        )}
      </span>
      <span className={cx(collapsed ? "sr-only" : "truncate")}>{label}</span>
    </Link>
  );
};

const ExpatsModeDropdown = ({
  collapsed,
  pathname,
  t,
  onItemClick,
}: {
  collapsed: boolean;
  pathname: string;
  t: (key: string) => string;
  onItemClick?: () => void;
}) => {
  const isExpatsModeActive = useExpatsModeStore((s) => s.isExpatsModeActive);
  const [isOpen, setIsOpen] = useState(true);

  if (!isExpatsModeActive) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cx(
          "flex w-full items-center gap-2 rounded-[var(--radius-xl)] bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-md transition hover:from-blue-600 hover:to-blue-700",
          collapsed && "justify-center px-2"
        )}
        aria-expanded={isOpen}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center">
          <SidebarIcon name="expats" size={36} />
        </span>
        {!collapsed && (
          <>
            <span className="flex-1 truncate text-left">{t("Expats Mode")}</span>
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className={cx(
                "h-4 w-4 shrink-0 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </>
        )}
      </button>

      {isOpen && !collapsed && (
        <div className="mt-1 ml-4 space-y-1 border-l-2 border-blue-200 pl-2">
          {EXPATS_MENU_ITEMS.map((item) =>
            renderItem(item, pathname, collapsed, t, onItemClick)
          )}
        </div>
      )}
    </div>
  );
};

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

  const zyraIndex = menuItems.findIndex((item) => item.id === "zyra");
  const insertAt = zyraIndex === -1 ? menuItems.length : zyraIndex;
  const beforeZyra = menuItems.slice(0, insertAt);
  const fromZyra = menuItems.slice(insertAt);

  return (
    <nav
      className={cx("space-y-2", className)}
      aria-label={t("Main navigation")}
      {...props}
    >
      {beforeZyra.map((item) => renderItem(item, pathname, collapsed, t, onItemClick))}
      <ExpatsModeDropdown
        collapsed={collapsed}
        pathname={pathname}
        t={t}
        onItemClick={onItemClick}
      />
      {fromZyra.map((item) => renderItem(item, pathname, collapsed, t, onItemClick))}
    </nav>
  );
};
