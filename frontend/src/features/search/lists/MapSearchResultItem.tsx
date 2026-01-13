import type { SearchResultItemProps } from "./SearchResultItem";
import { SearchResultItem } from "./SearchResultItem";
import { cx } from "@/lib/classNames";

export interface MapSearchResultItemProps {
  className?: string;
  items: SearchResultItemProps[];
}

export const MapSearchResultItem = ({
  className,
  items,
}: MapSearchResultItemProps) => (
  <div className={cx("grid gap-3", className)}>
    {items.map((item, index) => (
      <SearchResultItem key={`${item.title}-${index}`} {...item} />
    ))}
  </div>
);
