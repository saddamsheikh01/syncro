"use client";

import Link from "next/link";
import type { ReactNode, CSSProperties } from "react";
import { cx } from "@/lib/classNames";

export type QuickActionVariant =
  | "map"
  | "match"
  | "experiences"
  | "places"
  | "feed"
  | "chat"
  | "tests"
  | "zyra"
  | "default";

export interface QuickActionTileProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  iconWrapperClassName?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  variant?: QuickActionVariant;
}

const VARIANT_STYLES: Record<
  QuickActionVariant,
  {
    card: string;
    iconWrapper: string;
    cardStyle?: CSSProperties;
    iconStyle?: CSSProperties;
  }
> = {
  map: {
    card: "border-[var(--qa-map-border)] hover:shadow-[0_8px_30px_var(--qa-map-glow)]",
    iconWrapper: "text-white",
    cardStyle: {
      background:
        "linear-gradient(135deg, var(--qa-map-bg) 0%, transparent 60%)",
    },
    iconStyle: {
      background:
        "linear-gradient(135deg, var(--qa-map-gradient-start), var(--qa-map-gradient-end))",
    },
  },
  match: {
    card: "border-[var(--qa-match-border)] hover:shadow-[0_8px_30px_var(--qa-match-glow)]",
    iconWrapper: "text-white",
    cardStyle: {
      background:
        "linear-gradient(135deg, var(--qa-match-bg) 0%, transparent 60%)",
    },
    iconStyle: {
      background:
        "linear-gradient(135deg, var(--qa-match-gradient-start), var(--qa-match-gradient-end))",
    },
  },
  experiences: {
    card: "border-[var(--qa-experiences-border)] hover:shadow-[0_8px_30px_var(--qa-experiences-glow)]",
    iconWrapper: "text-white",
    cardStyle: {
      background:
        "linear-gradient(135deg, var(--qa-experiences-bg) 0%, transparent 60%)",
    },
    iconStyle: {
      background:
        "linear-gradient(135deg, var(--qa-experiences-gradient-start), var(--qa-experiences-gradient-end))",
    },
  },
  places: {
    card: "border-[var(--qa-places-border)] hover:shadow-[0_8px_30px_var(--qa-places-glow)]",
    iconWrapper: "text-white",
    cardStyle: {
      background:
        "linear-gradient(135deg, var(--qa-places-bg) 0%, transparent 60%)",
    },
    iconStyle: {
      background:
        "linear-gradient(135deg, var(--qa-places-gradient-start), var(--qa-places-gradient-end))",
    },
  },
  feed: {
    card: "border-[var(--qa-feed-border)] hover:shadow-[0_8px_30px_var(--qa-feed-glow)]",
    iconWrapper: "text-white",
    cardStyle: {
      background:
        "linear-gradient(135deg, var(--qa-feed-bg) 0%, transparent 60%)",
    },
    iconStyle: {
      background:
        "linear-gradient(135deg, var(--qa-feed-gradient-start), var(--qa-feed-gradient-end))",
    },
  },
  chat: {
    card: "border-[var(--qa-chat-border)] hover:shadow-[0_8px_30px_var(--qa-chat-glow)]",
    iconWrapper: "text-white",
    cardStyle: {
      background:
        "linear-gradient(135deg, var(--qa-chat-bg) 0%, transparent 60%)",
    },
    iconStyle: {
      background:
        "linear-gradient(135deg, var(--qa-chat-gradient-start), var(--qa-chat-gradient-end))",
    },
  },
  tests: {
    card: "border-[var(--qa-tests-border)] hover:shadow-[0_8px_30px_var(--qa-tests-glow)]",
    iconWrapper: "text-white",
    cardStyle: {
      background:
        "linear-gradient(135deg, var(--qa-tests-bg) 0%, transparent 60%)",
    },
    iconStyle: {
      background:
        "linear-gradient(135deg, var(--qa-tests-gradient-start), var(--qa-tests-gradient-end))",
    },
  },
  zyra: {
    card: "border-[var(--zyra-border)] hover:shadow-[0_12px_30px_var(--zyra-glow)]",
    iconWrapper: "bg-[var(--zyra-glow)] border border-[var(--zyra-border)]",
    cardStyle: {
      background:
        "linear-gradient(135deg, var(--zyra-glow) 0%, transparent 60%)",
    },
    iconStyle: undefined,
  },
  default: {
    card: "border-border hover:shadow-md",
    iconWrapper: "bg-surface-muted text-foreground",
    cardStyle: undefined,
    iconStyle: undefined,
  },
};

const BASE_CLASSES =
  "group relative flex flex-col gap-3 rounded-[var(--radius-lg)] border bg-card p-4 text-left shadow-sm transition-all duration-300 hover:scale-[1.02]";

export const QuickActionTile = ({
  title,
  subtitle,
  icon,
  iconWrapperClassName,
  href,
  onClick,
  className,
  variant = "default",
}: QuickActionTileProps) => {
  const styles = VARIANT_STYLES[variant];

  const content = (
    <>
      {/* Subtle animated gradient overlay on hover */}
      {variant !== "default" && variant !== "zyra" && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[var(--radius-lg)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${styles.cardStyle?.background?.toString().includes("var(--qa-")
              ? styles.cardStyle.background.toString().replace("linear-gradient(135deg, ", "").replace(" 0%, transparent 60%)", "")
              : "transparent"
            } 0%, transparent 70%)`,
          }}
        />
      )}

      {icon ? (
        <div
          className={cx(
            "relative inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] transition-transform duration-300 group-hover:scale-110",
            styles.iconWrapper,
            iconWrapperClassName
          )}
          style={styles.iconStyle}
        >
          {icon}
        </div>
      ) : null}
      <div className="relative space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {subtitle ? (
          <p className="text-xs text-muted transition-colors duration-300 group-hover:text-foreground/70">
            {subtitle}
          </p>
        ) : null}
      </div>
    </>
  );

  const cardClasses = cx(BASE_CLASSES, styles.card, className);

  if (href) {
    return (
      <Link href={href} className={cardClasses} style={styles.cardStyle}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cardClasses}
      style={styles.cardStyle}
    >
      {content}
    </button>
  );
};
