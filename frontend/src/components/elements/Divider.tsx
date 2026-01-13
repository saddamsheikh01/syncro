import type { HTMLAttributes } from "react";
import { cx } from "@/lib/classNames";

export type DividerAlign = "left" | "center" | "right";

export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  align?: DividerAlign;
}

export const Divider = ({
  className,
  label,
  align = "center",
  ...props
}: DividerProps) => (
  <div className={cx("flex items-center gap-4", className)} {...props}>
    <span className="h-px flex-1 bg-border" />
    {label ? (
      <span
        className={cx(
          "text-xs font-semibold uppercase tracking-[0.2em] text-subtle",
          align === "left" && "order-first",
          align === "right" && "order-last"
        )}
      >
        {label}
      </span>
    ) : null}
    <span className="h-px flex-1 bg-border" />
  </div>
);
