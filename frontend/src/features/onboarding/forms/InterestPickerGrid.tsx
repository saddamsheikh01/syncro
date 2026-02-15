"use client";

import type { HTMLAttributes } from "react";
import { Badge } from "@/components/elements/Badge";
import { Card } from "@/components/elements/Card";
import { MapInterestOptionCard } from "@/features/onboarding/lists/MapInterestOptionCard";
import type { InterestOptionItem } from "@/features/onboarding/lists/MapInterestOptionCard";
import { useT } from "@/hooks";
import { cx } from "@/lib/classNames";

export interface InterestPickerGridProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "title"
> {
  title?: string;
  subtitle?: string;
  hint?: string;
  items: InterestOptionItem[];
  maxSelections?: number;
  onItemToggle?: (id: string, nextSelected: boolean) => void;
}

export const InterestPickerGrid = ({
  className,
  title = "Your interests",
  subtitle = "Select the topics that represent you.",
  hint,
  items,
  maxSelections,
  onItemToggle,
  ...props
}: InterestPickerGridProps) => {
  const { t } = useT();
  const selectedCount = items.filter((item) => item.selected).length;
  const showCount = typeof maxSelections === "number";
  const resolvedTitle = title ? t(title) : t("Your interests");
  const resolvedSubtitle = subtitle ? t(subtitle) : null;
  const resolvedHint = hint ? t(hint) : null;

  return (
    <Card className={cx("space-y-4 p-5", className)} {...props}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h4 className="text-base font-semibold text-foreground">{resolvedTitle}</h4>
          {resolvedSubtitle ? (
            <p className="text-sm text-muted">{resolvedSubtitle}</p>
          ) : null}
        </div>
        {showCount ? (
          <Badge size="sm" tone="neutral">
            {selectedCount}/{maxSelections}
          </Badge>
        ) : null}
      </div>
      <MapInterestOptionCard items={items} onItemToggle={onItemToggle} />
      {resolvedHint ? <p className="text-xs text-subtle">{resolvedHint}</p> : null}
    </Card>
  );
};
