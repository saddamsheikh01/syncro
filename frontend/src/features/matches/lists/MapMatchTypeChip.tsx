"use client";

import { cx } from "@/lib/classNames";
import { MatchTypeChip } from "../elements/MatchTypeChip";

export interface MatchTypeItem {
  id: string;
  label: string;
  selected?: boolean;
  disabled?: boolean;
}

export interface MapMatchTypeChipProps {
  className?: string;
  items: MatchTypeItem[];
  onItemToggle?: (id: string, nextSelected: boolean) => void;
}

export const MapMatchTypeChip = ({
  className,
  items,
  onItemToggle,
}: MapMatchTypeChipProps) => (
  <div className={cx("flex flex-wrap gap-2", className)}>
    {items.map((item) => (
      <MatchTypeChip
        key={item.id}
        label={item.label}
        selected={item.selected}
        disabled={item.disabled}
        onToggleState={(nextSelected) => onItemToggle?.(item.id, nextSelected)}
      />
    ))}
  </div>
);
