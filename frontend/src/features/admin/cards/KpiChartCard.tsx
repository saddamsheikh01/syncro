import type { HTMLAttributes } from "react";
import { Card } from "@/components/elements/Card";
import { Badge } from "@/components/elements/Badge";
import { cx } from "@/lib/classNames";

export interface KpiChartCardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: string;
  value: string;
  deltaLabel?: string;
  deltaTone?: "neutral" | "accent" | "success" | "warning" | "danger";
  subtitle?: string;
  dataPoints?: number[];
}

export const KpiChartCard = ({
  className,
  title,
  value,
  deltaLabel,
  deltaTone = "success",
  subtitle,
  dataPoints = [20, 34, 28, 48, 40, 60, 52],
  ...props
}: KpiChartCardProps) => (
  <Card className={cx("space-y-4 p-5", className)} {...props}>
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {subtitle ? <p className="text-xs text-subtle">{subtitle}</p> : null}
      </div>
      {deltaLabel ? (
        <Badge tone={deltaTone} size="sm">
          {deltaLabel}
        </Badge>
      ) : null}
    </div>
    <div className="text-2xl font-semibold text-foreground">{value}</div>
    <div className="flex h-20 items-end gap-2">
      {dataPoints.map((point, index) => (
        <div
          key={`${title}-${index}`}
          className="flex-1 rounded-full bg-accent/20"
          style={{ height: `${Math.max(point, 6)}%` }}
        />
      ))}
    </div>
  </Card>
);
