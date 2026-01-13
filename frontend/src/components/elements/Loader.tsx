import type { HTMLAttributes } from "react";
import { cx } from "@/lib/classNames";

export type LoaderSize = "sm" | "md" | "lg";

export interface LoaderProps extends HTMLAttributes<HTMLDivElement> {
  size?: LoaderSize;
}

const SIZE_CLASSES: Record<LoaderSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
};

export const Loader = ({ className, size = "md", ...props }: LoaderProps) => (
  <div
    className={cx(
      "animate-spin rounded-full border-current border-t-transparent text-accent",
      SIZE_CLASSES[size],
      className
    )}
    {...props}
  />
);
