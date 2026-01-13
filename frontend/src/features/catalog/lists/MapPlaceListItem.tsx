import type { PlaceListItemProps } from "../cards/PlaceListItem";
import { PlaceListItem } from "../cards/PlaceListItem";
import { cx } from "@/lib/classNames";

export interface MapPlaceListItemProps {
  className?: string;
  items: PlaceListItemProps[];
}

export const MapPlaceListItem = ({ className, items }: MapPlaceListItemProps) => (
  <div className={cx("grid gap-4", className)}>
    {items.map((item, index) => (
      <PlaceListItem key={`${item.title}-${index}`} {...item} />
    ))}
  </div>
);
