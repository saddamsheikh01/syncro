"use client";

import { useMemo } from "react";
import type { HTMLAttributes } from "react";
import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";

export interface TestsHelperCardProps
  extends HTMLAttributes<HTMLDivElement> {
  completedCount?: number | null;
  totalTests?: number;
  loading?: boolean;
}

const resolveProgressLabel = (
  completedCount: number | null | undefined,
  totalTests?: number
) => {
  if (!totalTests || totalTests <= 0) {
    return completedCount == null ? "Progress pending" : `${completedCount} completed`;
  }
  if (completedCount == null) {
    return `0 / ${totalTests} completed`;
  }
  return `${completedCount} / ${totalTests} completed`;
};

const resolveTitle = (completedCount: number | null | undefined) => {
  if (completedCount == null) return "Boost Zyra to the max";
  if (completedCount === 0) return "Start with your first insight";
  if (completedCount < 3) return "Refine your profile";
  return "Profile in progress";
};

const resolveDescription = (completedCount: number | null | undefined) => {
  if (completedCount == null) {
    return "Fetching your progress so we can see what to improve.";
  }
  if (completedCount === 0) {
    return "Insights help Zyra understand you and suggest better matches.";
  }
  if (completedCount < 3) {
    return "Each insight adds valuable signals—just a few minutes make a difference.";
  }
  return "Great job—keep completing insights for even more accurate matches.";
};

export const TestsHelperCard = ({
  className,
  completedCount,
  totalTests,
  loading,
  ...props
}: TestsHelperCardProps) => {
  const progressLabel = useMemo(
    () => resolveProgressLabel(completedCount, totalTests),
    [completedCount, totalTests]
  );
  const title = resolveTitle(completedCount);
  const description = resolveDescription(completedCount);

  return (
    <Card
      className={cx(
        "relative overflow-hidden border border-border/70 bg-surface p-5",
        className
      )}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.16),_transparent_65%)]" />
      <div className="relative space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">
              Insight guide
            </p>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
          </div>
          <span className="rounded-full bg-qa-tests-bg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--qa-tests-gradient-start)]">
            {loading ? "..." : progressLabel}
          </span>
        </div>

        <p className="text-sm text-muted">{description}</p>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              label: "What you get",
              value: "More accurate matches",
            },
            {
              label: "Average time",
              value: "2-3 minutes",
            },
            {
              label: "Flexibility",
              value: "Whenever you want",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[var(--radius-md)] border border-border/70 bg-surface-muted/60 p-3 text-center"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">
                {item.label}
              </p>
              <p className="text-sm font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-subtle">
          Zyra updates your profile after each completed insight.
        </p>
      </div>
    </Card>
  );
};
