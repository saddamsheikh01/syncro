"use client";

import type { ReactNode } from "react";
import { InterestOptionCard } from "@/features/onboarding/elements/InterestOptionCard";
import { cx } from "@/lib/classNames";

export interface InterestOptionItem {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  selected?: boolean;
  disabled?: boolean;
}

export interface MapInterestOptionCardProps {
  className?: string;
  items: InterestOptionItem[];
  onItemToggle?: (id: string, nextSelected: boolean) => void;
}

export const MapInterestOptionCard = ({
  className,
  items,
  onItemToggle,
}: MapInterestOptionCardProps) => (
  <div className={cx("grid gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}>
    {items.map((item) => (
      <InterestOptionCard
        key={item.id}
        label={item.label}
        description={item.description}
        icon={item.icon}
        selected={item.selected}
        disabled={item.disabled}
        onToggleState={(nextSelected) => onItemToggle?.(item.id, nextSelected)}
      />
    ))}
  </div>
);
