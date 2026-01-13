"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/lib/classNames";

export interface QuickActionTileProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

const BASE_CLASSES =
  "flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-card p-4 text-left shadow-sm transition hover:shadow-md";

export const QuickActionTile = ({
  title,
  subtitle,
  icon,
  href,
  onClick,
  className,
}: QuickActionTileProps) => {
  const content = (
    <>
      {icon ? (
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-surface-muted text-foreground">
          {icon}
        </div>
      ) : null}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {subtitle ? <p className="text-xs text-muted">{subtitle}</p> : null}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cx(BASE_CLASSES, className)}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(BASE_CLASSES, className)}
    >
      {content}
    </button>
  );
};
