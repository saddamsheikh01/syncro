import Link from "next/link";
import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/classNames";

export interface ErrorStateProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  actionHref?: string;
}

export const ErrorState = ({
  className,
  title,
  description,
  icon,
  actionLabel,
  actionHref,
  ...props
}: ErrorStateProps) => (
  <div
    className={cx(
      "flex flex-col items-start gap-4 rounded-[var(--radius-lg)] border border-danger/20 bg-danger/10 p-6",
      className
    )}
    {...props}
  >
    {icon ? (
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-danger/20 text-danger">
        {icon}
      </div>
    ) : null}
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="text-sm text-muted">{description}</p>
      ) : null}
    </div>
    {actionLabel && actionHref ? (
      <Link
        href={actionHref}
        className="inline-flex items-center rounded-[var(--radius-md)] border border-danger/30 bg-surface px-3 py-2 text-sm font-semibold text-foreground"
      >
        {actionLabel}
      </Link>
    ) : null}
  </div>
);
