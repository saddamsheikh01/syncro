import type { HTMLAttributes } from "react";
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
  label = "Completamento",
  current,
  total,
  helper,
  ...props
}: SubmissionProgressProps) => {
  const rawProgress = total > 0 ? (current / total) * 100 : 0;
  const progress = Math.min(Math.max(rawProgress, 0), 100);

  return (
    <div
      className={cx(
        "space-y-2 rounded-[var(--radius-md)] border border-border bg-card p-4 shadow-sm",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <span className="text-xs font-semibold text-subtle">
          {current}/{total}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-surface-muted">
        <div
          className="h-2 rounded-full bg-accent"
          style={{ width: `${progress}%` }}
        />
      </div>
      {helper ? <p className="text-xs text-subtle">{helper}</p> : null}
    </div>
  );
};
