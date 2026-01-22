"use client";

import { cx } from "@/lib/classNames";

export type NavIconName =
  | "home"
  | "chat"
  | "map"
  | "map-pin"
  | "spark"
  | "star"
  | "calendar"
  | "users"
  | "briefcase"
  | "check"
  | "wallet"
  | "document"
  | "sliders"
  | "user"
  | "bell"
  | "clipboard"
  | "search"
  | "chevron-right"
  | "chevron-left"
  | "info"
  | "menu"
  | "x";

export interface NavIconProps {
  name: NavIconName;
  className?: string;
}

const renderIcon = (name: NavIconName) => {
  switch (name) {
    case "home":
      return (
        <>
          <path d="M4 10.5l8-6 8 6" />
          <path d="M6.5 9.5V19h4.5v-5h2v5h4.5V9.5" />
        </>
      );
    case "chat":
      return <path d="M4.5 6h15v9h-9l-5 4V6z" />;
    case "map":
      return (
        <>
          <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z" />
          <circle cx="12" cy="11" r="2.5" />
        </>
      );
    case "map-pin":
      return (
        <>
          <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z" />
          <circle cx="12" cy="11" r="2" />
        </>
      );
    case "spark":
      return (
        <path d="M12 3l2.6 5.4 6 .9-4.3 4.2 1 6-5.3-2.9-5.3 2.9 1-6-4.3-4.2 6-.9L12 3z" />
      );
    case "star":
      return (
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      );
    case "calendar":
      return (
        <>
          <rect x="4" y="6" width="16" height="14" rx="2" />
          <path d="M8 3v4M16 3v4M4 10h16" />
        </>
      );
    case "users":
      return (
        <>
          <circle cx="9" cy="9" r="3" />
          <path d="M2.5 19c1.8-3 4.2-4.5 6.5-4.5s4.7 1.5 6.5 4.5" />
          <circle cx="17" cy="8.5" r="2.5" />
          <path d="M14.5 18c.7-1.6 2-2.8 3.5-3.4" />
        </>
      );
    case "briefcase":
      return (
        <>
          <rect x="4" y="7" width="16" height="12" rx="2" />
          <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
          <path d="M4 12h16" />
        </>
      );
    case "check":
      return (
        <>
          <rect x="4" y="4" width="16" height="16" rx="4" />
          <path d="M8.5 12.5l2.5 2.5 4.5-5" />
        </>
      );
    case "wallet":
      return (
        <>
          <rect x="3.5" y="6" width="17" height="12" rx="2" />
          <path d="M16.5 10h4v4h-4a2 2 0 0 1 0-4z" />
        </>
      );
    case "document":
      return (
        <>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </>
      );
    case "sliders":
      return (
        <>
          <path d="M4 6h16M4 12h16M4 18h16" />
          <circle cx="8" cy="6" r="2" />
          <circle cx="15" cy="12" r="2" />
          <circle cx="10" cy="18" r="2" />
        </>
      );
    case "user":
      return (
        <>
          <circle cx="12" cy="8" r="3" />
          <path d="M5 19c1.6-3 4-4.5 7-4.5s5.4 1.5 7 4.5" />
        </>
      );
    case "bell":
      return (
        <>
          <path d="M12 5a4 4 0 0 0-4 4v3.5L6.5 15h11L16 12.5V9a4 4 0 0 0-4-4z" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </>
      );
    case "clipboard":
      return (
        <>
          <rect x="6" y="4" width="12" height="16" rx="2" />
          <rect x="9" y="4" width="6" height="3" rx="1" />
          <path d="M9 10h6M9 14h6" />
        </>
      );
    case "search":
      return (
        <>
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </>
      );
    case "chevron-right":
      return <path d="M9 18l6-6-6-6" />;
    case "chevron-left":
      return <path d="M15 18l-6-6 6-6" />;
    case "info":
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 16v-4M12 8h.01" />
        </>
      );
    case "menu":
      return (
        <>
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
        </>
      );
    case "x":
      return (
        <>
          <path d="M18 6L6 18" />
          <path d="M6 6l12 12" />
        </>
      );
    default:
      return <circle cx="12" cy="12" r="4" />;
  }
};

export const NavIcon = ({ name, className }: NavIconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cx("h-5 w-5", className)}
    aria-hidden="true"
  >
    {renderIcon(name)}
  </svg>
);
