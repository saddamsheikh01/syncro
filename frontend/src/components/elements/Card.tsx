import type { HTMLAttributes } from "react";
import { cx } from "@/lib/classNames";

export type CardVariant = "default" | "muted";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

export const Card = ({ className, variant = "default", ...props }: CardProps) => (
  <div
    className={cx(
      "rounded-[var(--radius-lg)] border border-border/70 bg-card shadow-sm",
      variant === "muted" && "bg-surface-muted",
      className
    )}
    {...props}
  />
);

export const CardHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cx("border-b border-border/70 px-6 py-4", className)} {...props} />
);

export const CardBody = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cx("px-6 py-5", className)} {...props} />
);

export const CardFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cx("border-t border-border/70 px-6 py-4", className)} {...props} />
);
