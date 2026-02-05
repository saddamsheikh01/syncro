import type { TestListItemProps } from "./TestListItem";
import { TestListItem } from "./TestListItem";
import { cx } from "@/lib/classNames";

export interface MapTestListItemProps {
  className?: string;
  items: TestListItemProps[];
}

export const MapTestListItem = ({ className, items }: MapTestListItemProps) => (
  <div className={cx("grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5", className)}>
    {items.map((item, index) => (
      <TestListItem key={`${item.title}-${index}`} {...item} />
    ))}
  </div>
);
