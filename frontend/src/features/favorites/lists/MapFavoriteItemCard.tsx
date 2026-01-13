import type { FavoriteItemCardProps } from "../cards/FavoriteItemCard";
import { FavoriteItemCard } from "../cards/FavoriteItemCard";
import { cx } from "@/lib/classNames";

export interface MapFavoriteItemCardProps {
  className?: string;
  items: FavoriteItemCardProps[];
}

export const MapFavoriteItemCard = ({
  className,
  items,
}: MapFavoriteItemCardProps) => (
  <div className={cx("grid gap-4", className)}>
    {items.map((item, index) => (
      <FavoriteItemCard key={`${item.title}-${index}`} {...item} />
    ))}
  </div>
);
