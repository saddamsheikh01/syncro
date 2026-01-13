import type { HTMLAttributes } from "react";
import { cx } from "@/lib/classNames";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
}

export const Skeleton = ({
  className,
  width,
  height,
  style,
  ...props
}: SkeletonProps) => (
  <div
    className={cx(
      "animate-pulse rounded-[var(--radius-md)] bg-surface-muted",
      className
    )}
    style={{ width, height, ...style }}
    {...props}
  />
);
