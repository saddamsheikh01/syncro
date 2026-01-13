import type { HTMLAttributes } from "react";
import { cx } from "@/lib/classNames";

export type LegendTone = "neutral" | "accent" | "success" | "warning" | "danger";

const TONE_CLASSES: Record<LegendTone, string> = {
  neutral: "bg-border",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export interface LegendItemProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  label: string;
  description?: string;
  count?: number;
  tone?: LegendTone;
  swatch?: string;
}

export const LegendItem = ({
  className,
  label,
  description,
  count,
  tone = "neutral",
  swatch,
  ...props
}: LegendItemProps) => (
  <div className={cx("flex items-start justify-between gap-3", className)} {...props}>
    <div className="flex items-start gap-3">
      <span
        className={cx("mt-1 h-2.5 w-2.5 rounded-full", !swatch && TONE_CLASSES[tone])}
        style={swatch ? { backgroundColor: swatch } : undefined}
      />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {description ? (
          <p className="text-xs text-subtle">{description}</p>
        ) : null}
      </div>
    </div>
    {typeof count === "number" ? (
      <span className="text-xs font-semibold text-subtle">{count}</span>
    ) : null}
  </div>
);
