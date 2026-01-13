"use client";

import { cx } from "@/lib/classNames";
import { TagPillSelectable } from "../elements/TagPillSelectable";

export interface TagPillSelectableItem {
  id: string;
  label: string;
  selected?: boolean;
  disabled?: boolean;
}

export interface MapTagPillSelectableProps {
  className?: string;
  items: TagPillSelectableItem[];
  onItemToggle?: (id: string, nextSelected: boolean) => void;
}

export const MapTagPillSelectable = ({
  className,
  items,
  onItemToggle,
}: MapTagPillSelectableProps) => (
  <div className={cx("flex flex-wrap gap-2", className)}>
    {items.map((item) => (
      <TagPillSelectable
        key={item.id}
        label={item.label}
        selected={item.selected}
        disabled={item.disabled}
        onToggleState={(nextSelected) => onItemToggle?.(item.id, nextSelected)}
      />
    ))}
  </div>
);
