import type { ExperienceListItemProps } from "../cards/ExperienceListItem";
import { ExperienceListItem } from "../cards/ExperienceListItem";
import { cx } from "@/lib/classNames";

export interface MapExperienceListItemProps {
  className?: string;
  items: ExperienceListItemProps[];
}

export const MapExperienceListItem = ({
  className,
  items,
}: MapExperienceListItemProps) => (
  <div className={cx("grid gap-4", className)}>
    {items.map((item, index) => (
      <ExperienceListItem key={`${item.title}-${index}`} {...item} />
    ))}
  </div>
);
