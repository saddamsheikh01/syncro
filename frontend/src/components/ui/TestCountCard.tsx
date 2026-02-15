"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";
import { useT } from "@/hooks";

const ClipboardIcon = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
  </svg>
);

export type TestCountCardVariant = "default" | "compact";

export interface TestCountCardProps
  extends HTMLAttributes<HTMLDivElement> {
  count?: number | null;
  loading?: boolean;
  title?: string;
  description?: string;
  action?: ReactNode;
  variant?: TestCountCardVariant;
}

type Translator = (key: string, values?: Record<string, string | number>) => string;

const resolveDescription = (t: Translator, count: number | null | undefined) => {
  if (count == null) {
    return t("Preparing your insight progress.");
  }
  if (count === 0) {
    return t("Start with your first insight to activate matches.");
  }
  if (count < 3) {
    return t("Complete more insights to refine your profile.");
  }
  return t("Great job: your profile is more precise.");
};

export const TestCountCard = ({
  count,
  loading,
  title = "Insights completed",
  description,
  action,
  variant = "default",
  className,
  ...props
}: TestCountCardProps) => {
  const { t } = useT();
  const displayCount =
    loading && count == null ? "..." : String(count ?? 0);
  const resolvedTitle = title ? t(title) : t("Insights completed");
  const bodyDescription = description ? t(description) : resolveDescription(t, count);

  return (
    <Card
      className={cx(
        "relative overflow-hidden border border-border/70 bg-surface",
        variant === "default" ? "p-5" : "p-4",
        className
      )}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.14),_transparent_70%)]" />
      <div className="relative space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">
            {resolvedTitle}
          </p>
          <span className="rounded-full bg-qa-tests-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--qa-tests-gradient-start)]">
            {t("Zyra")}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-qa-tests-bg text-[var(--qa-tests-gradient-start)]">
            <ClipboardIcon />
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-semibold text-foreground">{displayCount}</p>
            <p className="text-xs text-muted">{bodyDescription}</p>
          </div>
        </div>
        {action ? <div>{action}</div> : null}
      </div>
    </Card>
  );
};
