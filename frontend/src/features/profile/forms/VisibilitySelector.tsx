"use client";

import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";
import type { VisibilityOptionChipProps } from "../elements/VisibilityOptionChip";
import { MapVisibilityOptionChip } from "../lists/MapVisibilityOptionChip";

export interface VisibilitySelectorProps {
  className?: string;
  title?: string;
  description?: string;
  items: VisibilityOptionChipProps[];
  onItemToggle?: (index: number, nextSelected: boolean) => void;
}

export const VisibilitySelector = ({
  className,
  title = "Profile visibility",
  description = "Manage what is shown on your profile.",
  items,
  onItemToggle,
}: VisibilitySelectorProps) => (
  <Card className={cx("space-y-4 p-5", className)}>
    <div className="space-y-1">
      <h4 className="text-base font-semibold text-foreground">{title}</h4>
      <p className="text-sm text-muted">{description}</p>
    </div>
    <MapVisibilityOptionChip items={items} onItemToggle={onItemToggle} />
  </Card>
);
