"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";
import { useT } from "@/hooks";

export interface AdminPageHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export const AdminPageHeader = ({
  title,
  subtitle,
  actions,
  className,
  ...props
}: AdminPageHeaderProps) => {
  const { t } = useT();

  return (
    <Card
      className={cx(
        "flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-xl)] border-border/70 bg-surface/90 p-5 shadow-sm",
        className
      )}
      {...props}
    >
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-subtle">
          {t("Back office")}
        </p>
        <h1 className="text-2xl font-semibold text-foreground">
          {t(title)}
        </h1>
        {subtitle ? <p className="text-sm text-muted">{t(subtitle)}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </Card>
  );
};
