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
}

export const VisibilitySelector = ({
  className,
  title = "Visibilita profilo",
  description = "Gestisci cosa mostrare nel tuo profilo.",
  items,
}: VisibilitySelectorProps) => (
  <Card className={cx("space-y-4 p-5", className)}>
    <div className="space-y-1">
      <h4 className="text-base font-semibold text-foreground">{title}</h4>
      <p className="text-sm text-muted">{description}</p>
    </div>
    <MapVisibilityOptionChip items={items} />
  </Card>
);
