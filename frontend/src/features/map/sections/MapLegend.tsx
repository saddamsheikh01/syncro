"use client";

import type { HTMLAttributes } from "react";
import { Card } from "@/components/elements/Card";
import { MapLegendItem } from "@/features/map/lists/MapLegendItem";
import type { LegendItemData } from "@/features/map/lists/MapLegendItem";
import { cx } from "@/lib/classNames";
import { useT } from "@/hooks";

export interface MapLegendProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: string;
  subtitle?: string;
  items: LegendItemData[];
}

export const MapLegend = ({
  className,
  title,
  subtitle,
  items,
  ...props
}: MapLegendProps) => {
  const { t } = useT();
  const resolvedTitle = title ? t(title) : t("Map legend");
  const resolvedSubtitle = subtitle ? t(subtitle) : undefined;
  const translatedItems = items.map((item) => ({
    ...item,
    label: t(item.label),
    description: item.description ? t(item.description) : undefined,
  }));

  return (
    <Card className={cx("space-y-4 p-4", className)} {...props}>
      {resolvedTitle ? (
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-foreground">
            {resolvedTitle}
          </h4>
          {resolvedSubtitle ? (
            <p className="text-xs text-subtle">{resolvedSubtitle}</p>
          ) : null}
        </div>
      ) : null}
      <MapLegendItem items={translatedItems} />
    </Card>
  );
};
