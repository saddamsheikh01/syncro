"use client";

import type { HTMLAttributes } from "react";
import { useT } from "@/hooks";
import { cx } from "@/lib/classNames";

export interface SubmissionProgressProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  label?: string;
  current: number;
  total: number;
  helper?: string;
}

export const SubmissionProgress = ({
  className,
  label = "Completion",
  current,
  total,
  helper,
  ...props
}: SubmissionProgressProps) => {
  const { t } = useT();
  const rawProgress = total > 0 ? (current / total) * 100 : 0;
  const progress = Math.min(Math.max(rawProgress, 0), 100);
  const resolvedLabel = label ? t(label) : t("Completion");
  const resolvedHelper = helper ? t(helper) : null;

  return (
    <div
      className={cx(
        "space-y-2 rounded-[var(--radius-md)] border border-border/70 bg-card p-4 shadow-sm",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{resolvedLabel}</span>
        <span className="text-xs font-semibold text-subtle">
          {current}/{total}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-surface-muted/80">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-[var(--accent-gradient-start)] to-[var(--accent-gradient-end)]"
          style={{ width: `${progress}%` }}
        />
      </div>
      {resolvedHelper ? <p className="text-xs text-subtle">{resolvedHelper}</p> : null}
    </div>
  );
};
