import { cx } from "@/lib/classNames";
import type { MatchInsightItemProps } from "../elements/MatchInsightItem";
import { MatchInsightItem } from "../elements/MatchInsightItem";

export interface MapMatchInsightItemProps {
  className?: string;
  items: MatchInsightItemProps[];
}

export const MapMatchInsightItem = ({
  className,
  items,
}: MapMatchInsightItemProps) => (
  <div className={cx("space-y-2", className)}>
    {items.map((item, index) => (
      <MatchInsightItem key={`${item.title}-${index}`} {...item} />
    ))}
  </div>
);
