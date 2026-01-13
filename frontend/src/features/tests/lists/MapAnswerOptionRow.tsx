"use client";

import { AnswerOptionRow } from "@/features/tests/elements/AnswerOptionRow";
import { cx } from "@/lib/classNames";

export interface AnswerOptionItem {
  id: string;
  label: string;
  description?: string;
  indexLabel?: string;
  selected?: boolean;
  disabled?: boolean;
}

export interface MapAnswerOptionRowProps {
  className?: string;
  items: AnswerOptionItem[];
  onItemToggle?: (id: string, nextSelected: boolean) => void;
}

export const MapAnswerOptionRow = ({
  className,
  items,
  onItemToggle,
}: MapAnswerOptionRowProps) => (
  <div className={cx("space-y-3", className)}>
    {items.map((item) => (
      <AnswerOptionRow
        key={item.id}
        label={item.label}
        description={item.description}
        indexLabel={item.indexLabel}
        selected={item.selected}
        disabled={item.disabled}
        onToggleState={(nextSelected) => onItemToggle?.(item.id, nextSelected)}
      />
    ))}
  </div>
);
