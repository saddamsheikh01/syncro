import type { HTMLAttributes } from "react";
import { cx } from "@/lib/classNames";

export interface UploadProgressChipProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  progress: number;
}

export const UploadProgressChip = ({
  className,
  label,
  progress,
  ...props
}: UploadProgressChipProps) => {
  const clamped = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div
      className={cx(
        "inline-flex items-center gap-3 rounded-full border border-border/60 bg-surface px-3 py-2 text-xs text-foreground",
        className
      )}
      {...props}
    >
      <span className="font-semibold">{label}</span>
      <div className="h-2 w-20 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-subtle">{clamped}%</span>
    </div>
  );
};
