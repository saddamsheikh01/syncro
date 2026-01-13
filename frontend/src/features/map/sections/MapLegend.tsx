import type { HTMLAttributes } from "react";
import { Card } from "@/components/elements/Card";
import { MapLegendItem } from "@/features/map/lists/MapLegendItem";
import type { LegendItemData } from "@/features/map/lists/MapLegendItem";
import { cx } from "@/lib/classNames";

export interface MapLegendProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: string;
  subtitle?: string;
  items: LegendItemData[];
}

export const MapLegend = ({
  className,
  title = "Legenda mappa",
  subtitle,
  items,
  ...props
}: MapLegendProps) => (
  <Card className={cx("space-y-4 p-4", className)} {...props}>
    {title ? (
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {subtitle ? <p className="text-xs text-subtle">{subtitle}</p> : null}
      </div>
    ) : null}
    <MapLegendItem items={items} />
  </Card>
);
