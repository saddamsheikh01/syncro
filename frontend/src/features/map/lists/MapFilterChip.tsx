"use client";

import { TagPillSelectable } from "@/features/tags/elements/TagPillSelectable";
import { cx } from "@/lib/classNames";

export interface FilterChipItem {
  id: string;
  label: string;
  selected?: boolean;
  disabled?: boolean;
}

export interface MapFilterChipProps {
  className?: string;
  items: FilterChipItem[];
  onItemToggle?: (id: string, nextSelected: boolean) => void;
}

export const MapFilterChip = ({
  className,
  items,
  onItemToggle,
}: MapFilterChipProps) => (
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
