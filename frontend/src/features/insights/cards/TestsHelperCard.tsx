"use client";

import { useMemo } from "react";
import type { HTMLAttributes } from "react";
import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";
import { useT } from "@/hooks";

export interface TestsHelperCardProps
  extends HTMLAttributes<HTMLDivElement> {
  completedCount?: number | null;
  totalTests?: number;
  loading?: boolean;
}

type Translator = (key: string, values?: Record<string, string | number>) => string;

const resolveProgressLabel = (
  t: Translator,
  completedCount: number | null | undefined,
  totalTests?: number
) => {
  if (!totalTests || totalTests <= 0) {
    return completedCount == null
      ? t("Progress pending")
      : t("{count} completed", { count: completedCount });
  }
  if (completedCount == null) {
    return t("{completed} / {total} completed", {
      completed: 0,
      total: totalTests,
    });
  }
  return t("{completed} / {total} completed", {
    completed: completedCount,
    total: totalTests,
  });
};

const resolveTitle = (t: Translator, completedCount: number | null | undefined) => {
  if (completedCount == null) return t("Boost Zyra to the max");
  if (completedCount === 0) return t("Start with your first insight");
  if (completedCount < 3) return t("Refine your profile");
  return t("Profile in progress");
};

const resolveDescription = (t: Translator, completedCount: number | null | undefined) => {
  if (completedCount == null) {
    return t("Fetching your progress so we can see what to improve.");
  }
  if (completedCount === 0) {
    return t("Insights help Zyra understand you and suggest better matches.");
  }
  if (completedCount < 3) {
    return t("Each insight adds valuable signals - just a few minutes make a difference.");
  }
  return t("Great job - keep completing insights for even more accurate matches.");
};

export const TestsHelperCard = ({
  className,
  completedCount,
  totalTests,
  loading,
  ...props
}: TestsHelperCardProps) => {
  const { t } = useT();
  const progressLabel = useMemo(
    () => resolveProgressLabel(t, completedCount, totalTests),
    [completedCount, t, totalTests]
  );
  const title = resolveTitle(t, completedCount);
  const description = resolveDescription(t, completedCount);

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
              {t("Insight guide")}
            </p>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
          </div>
          <span className="rounded-full bg-qa-tests-bg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--qa-tests-gradient-start)]">
            {loading ? t("...") : progressLabel}
          </span>
        </div>

        <p className="text-sm text-muted">{description}</p>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              labelKey: "What you get",
              valueKey: "More accurate matches",
            },
            {
              labelKey: "Average time",
              valueKey: "2-3 minutes",
            },
            {
              labelKey: "Flexibility",
              valueKey: "Whenever you want",
            },
          ].map((item) => (
            <div
              key={item.labelKey}
              className="rounded-[var(--radius-md)] border border-border/70 bg-surface-muted/60 p-3 text-center"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">
                {t(item.labelKey)}
              </p>
              <p className="text-sm font-semibold text-foreground">
                {t(item.valueKey)}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-subtle">
          {t("Zyra updates your profile after each completed insight.")}
        </p>
      </div>
    </Card>
  );
};
