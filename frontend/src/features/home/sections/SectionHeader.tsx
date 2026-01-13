"use client";

import Link from "next/link";
import type { HTMLAttributes } from "react";
import { cx } from "@/lib/classNames";

export interface SectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  onActionClick?: () => void;
}

export const SectionHeader = ({
  className,
  title,
  subtitle,
  actionLabel,
  actionHref,
  onActionClick,
  ...props
}: SectionHeaderProps) => (
  <div
    className={cx("flex flex-wrap items-center justify-between gap-4", className)}
    {...props}
  >
    <div className="space-y-1">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
    </div>
    {actionLabel ? (
      actionHref ? (
        <Link
          href={actionHref}
          className="text-sm font-semibold text-foreground"
        >
          {actionLabel}
        </Link>
      ) : (
        <button
          type="button"
          onClick={onActionClick}
          className="text-sm font-semibold text-foreground"
        >
          {actionLabel}
        </button>
      )
    ) : null}
  </div>
);
