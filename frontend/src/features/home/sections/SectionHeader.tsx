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

const ActionArrow = () => (
  <svg
    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

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
          className="group flex items-center gap-1.5 rounded-full border border-transparent bg-surface-muted px-3 py-1.5 text-sm font-medium text-muted transition-all duration-200 hover:border-accent/30 hover:bg-accent-soft hover:text-accent"
        >
          <span>{actionLabel}</span>
          <ActionArrow />
        </Link>
      ) : (
        <button
          type="button"
          onClick={onActionClick}
          className="group flex items-center gap-1.5 rounded-full border border-transparent bg-surface-muted px-3 py-1.5 text-sm font-medium text-muted transition-all duration-200 hover:border-accent/30 hover:bg-accent-soft hover:text-accent"
        >
          <span>{actionLabel}</span>
          <ActionArrow />
        </button>
      )
    ) : null}
  </div>
);
