"use client";

import { cx } from "@/lib/classNames";
import { useT } from "@/hooks";

export interface PriceLevelProps {
  level: number;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

const PRICE_LABELS: Record<number, string> = {
  0: "Free",
  1: "Budget",
  2: "Moderate",
  3: "Expensive",
  4: "Very expensive",
};

export const PriceLevel = ({
  level,
  size = "md",
  showLabel = false,
  className,
}: PriceLevelProps) => {
  const { t } = useT();
  const validLevel = Math.max(0, Math.min(4, level));
  const label = t(PRICE_LABELS[validLevel]);

  const symbolSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className={cx("flex items-center gap-1.5", className)}>
      <span className={cx("font-medium", symbolSize)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={i}
            className={i < validLevel ? "text-success" : "text-border"}
          >
            $
          </span>
        ))}
      </span>
      {showLabel && (
        <span className={cx("text-muted", size === "sm" ? "text-xs" : "text-sm")}>
          {label}
        </span>
      )}
    </div>
  );
};
