import type { HTMLAttributes } from "react";
import { cx } from "@/lib/classNames";

export interface PlaceMetaRowProps extends HTMLAttributes<HTMLDivElement> {
  items: string[];
}

export const PlaceMetaRow = ({ className, items, ...props }: PlaceMetaRowProps) => {
  const filtered = items.filter(Boolean);

  return (
    <div
      className={cx(
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-subtle",
        className
      )}
      {...props}
    >
      {filtered.map((item, index) => (
        <span key={`${item}-${index}`} className="inline-flex items-center gap-2">
          <span>{item}</span>
          {index < filtered.length - 1 ? (
            <span className="text-border-strong">|</span>
          ) : null}
        </span>
      ))}
    </div>
  );
};
