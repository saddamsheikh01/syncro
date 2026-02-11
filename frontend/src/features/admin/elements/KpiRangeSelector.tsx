import type { HTMLAttributes } from "react";
import { Button } from "@/components/buttons/Button";
import { cx } from "@/lib/classNames";

export interface KpiRangeItem {
  id: string;
  label: string;
}

export interface KpiRangeSelectorProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  ranges: KpiRangeItem[];
  selectedId?: string;
  onRangeSelect?: (rangeId: string) => void;
}

export const KpiRangeSelector = ({
  className,
  ranges,
  selectedId,
  onRangeSelect,
  ...props
}: KpiRangeSelectorProps) => (
  <div className={cx("flex flex-wrap items-center gap-2", className)} {...props}>
    {ranges.map((range) => {
      const isSelected = range.id === selectedId;
      return (
        <Button
          key={range.id}
          size="sm"
          variant={isSelected ? "secondary" : "ghost"}
          aria-pressed={isSelected}
          onClick={() => onRangeSelect?.(range.id)}
        >
          {range.label}
        </Button>
      );
    })}
  </div>
);
