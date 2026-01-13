import { LegendItem } from "@/features/map/elements/LegendItem";
import { cx } from "@/lib/classNames";
import type { LegendTone } from "@/features/map/elements/LegendItem";

export interface LegendItemData {
  id: string;
  label: string;
  description?: string;
  count?: number;
  tone?: LegendTone;
  swatch?: string;
}

export interface MapLegendItemProps {
  className?: string;
  items: LegendItemData[];
}

export const MapLegendItem = ({ className, items }: MapLegendItemProps) => (
  <div className={cx("space-y-3", className)}>
    {items.map((item) => (
      <LegendItem
        key={item.id}
        label={item.label}
        description={item.description}
        count={item.count}
        tone={item.tone}
        swatch={item.swatch}
      />
    ))}
  </div>
);
