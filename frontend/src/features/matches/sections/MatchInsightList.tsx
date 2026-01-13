import type { HTMLAttributes } from "react";
import { Card } from "@/components/elements/Card";
import { MapMatchInsightItem } from "@/features/matches/lists/MapMatchInsightItem";
import type { MatchInsightItemProps } from "@/features/matches/elements/MatchInsightItem";
import { cx } from "@/lib/classNames";

export interface MatchInsightListProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: string;
  subtitle?: string;
  items: MatchInsightItemProps[];
}

export const MatchInsightList = ({
  className,
  title,
  subtitle,
  items,
  ...props
}: MatchInsightListProps) => (
  <Card className={cx("space-y-3 p-5", className)} {...props}>
    {title ? (
      <div className="space-y-1">
        <h4 className="text-base font-semibold text-foreground">{title}</h4>
        {subtitle ? (
          <p className="text-xs text-subtle">{subtitle}</p>
        ) : null}
      </div>
    ) : null}
    <MapMatchInsightItem items={items} />
  </Card>
);
