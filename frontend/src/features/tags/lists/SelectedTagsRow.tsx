"use client";

import type { HTMLAttributes } from "react";
import { cx } from "@/lib/classNames";
import type { TagItem } from "./MapTag";
import { MapTag } from "./MapTag";

export interface SelectedTagsRowProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  items: TagItem[];
  onRemove?: (id: string) => void;
}

export const SelectedTagsRow = ({
  className,
  title,
  items,
  onRemove,
  ...props
}: SelectedTagsRowProps) => (
  <div className={cx("space-y-2", className)} {...props}>
    {title ? (
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
        {title}
      </p>
    ) : null}
    <MapTag items={items} onRemove={onRemove} />
  </div>
);
