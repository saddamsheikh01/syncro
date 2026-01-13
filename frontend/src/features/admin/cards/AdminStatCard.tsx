import type { HTMLAttributes } from "react";
import { Badge } from "@/components/elements/Badge";
import type { BadgeTone } from "@/components/elements/Badge";
import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";

export type AdminTrend = "up" | "down" | "neutral";

export interface AdminStatCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string;
  trendLabel?: string;
  trend?: AdminTrend;
}

const getTrendTone = (trend?: AdminTrend): BadgeTone => {
  if (trend === "up") return "success";
  if (trend === "down") return "danger";
  return "neutral";
};

export const AdminStatCard = ({
  className,
  label,
  value,
  trendLabel,
  trend = "neutral",
  ...props
}: AdminStatCardProps) => (
  <Card className={cx("p-5", className)} {...props}>
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
          {label}
        </p>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
      </div>
      {trendLabel ? (
        <Badge tone={getTrendTone(trend)}>{trendLabel}</Badge>
      ) : null}
    </div>
  </Card>
);
