"use client";

import { cx } from "@/lib/classNames";

export interface PriceLevelProps {
  level: number;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

const PRICE_LABELS: Record<number, string> = {
  0: "Gratis",
  1: "Economico",
  2: "Moderato",
  3: "Costoso",
  4: "Molto costoso",
};

export const PriceLevel = ({
  level,
  size = "md",
  showLabel = false,
  className,
}: PriceLevelProps) => {
  const validLevel = Math.max(0, Math.min(4, level));
  const label = PRICE_LABELS[validLevel];

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
