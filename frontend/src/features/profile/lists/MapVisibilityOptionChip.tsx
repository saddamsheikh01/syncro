"use client";

import { cx } from "@/lib/classNames";
import { VisibilityOptionChip } from "../elements/VisibilityOptionChip";
import type { VisibilityOptionChipProps } from "../elements/VisibilityOptionChip";

export interface MapVisibilityOptionChipProps {
  className?: string;
  items: VisibilityOptionChipProps[];
  onItemToggle?: (index: number, nextSelected: boolean) => void;
}

export const MapVisibilityOptionChip = ({
  className,
  items,
  onItemToggle,
}: MapVisibilityOptionChipProps) => (
  <div className={cx("grid gap-3", className)}>
    {items.map((item, index) => (
      <VisibilityOptionChip
        key={`${item.label}-${index}`}
        {...item}
        onToggleState={(nextSelected) => onItemToggle?.(index, nextSelected)}
      />
    ))}
  </div>
);
