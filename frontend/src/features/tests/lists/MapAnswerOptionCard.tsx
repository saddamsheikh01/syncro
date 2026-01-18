"use client";

import { AnswerOptionCard } from "@/features/tests/elements/AnswerOptionCard";
import { cx } from "@/lib/classNames";

export interface AnswerOptionCardItem {
  id: string;
  label: string;
  description?: string;
  selected?: boolean;
  disabled?: boolean;
}

export interface MapAnswerOptionCardProps {
  className?: string;
  items: AnswerOptionCardItem[];
  onItemToggle?: (id: string, nextSelected: boolean) => void;
}

export const MapAnswerOptionCard = ({
  className,
  items,
  onItemToggle,
}: MapAnswerOptionCardProps) => (
  <div className={cx(className)}>
    {items.map((item) => (
      <AnswerOptionCard
        key={item.id}
        label={item.label}
        description={item.description}
        selected={item.selected}
        disabled={item.disabled}
        onToggleState={(nextSelected) => onItemToggle?.(item.id, nextSelected)}
      />
    ))}
  </div>
);
