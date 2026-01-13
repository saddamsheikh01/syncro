import type { HTMLAttributes } from "react";
import { cx } from "@/lib/classNames";

export type MapClusterSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<MapClusterSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export interface MapClusterBadgeProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  count: number;
  size?: MapClusterSize;
}

export const MapClusterBadge = ({
  className,
  count,
  size = "md",
  ...props
}: MapClusterBadgeProps) => (
  <span
    className={cx(
      "inline-flex items-center justify-center rounded-full border border-border bg-accent text-accent-contrast shadow-md",
      SIZE_CLASSES[size],
      className
    )}
    {...props}
  >
    {count}
  </span>
);
