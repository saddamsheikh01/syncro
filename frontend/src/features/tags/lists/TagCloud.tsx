"use client";

import type { HTMLAttributes } from "react";
import { cx } from "@/lib/classNames";
import type { TagPillSelectableItem } from "./MapTagPillSelectable";
import { MapTagPillSelectable } from "./MapTagPillSelectable";

export interface TagCloudProps extends HTMLAttributes<HTMLDivElement> {
  items: TagPillSelectableItem[];
  onItemToggle?: (id: string, nextSelected: boolean) => void;
}

export const TagCloud = ({
  className,
  items,
  onItemToggle,
  ...props
}: TagCloudProps) => (
  <div
    className={cx(
      "rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-sm",
      className
    )}
    {...props}
  >
    <MapTagPillSelectable items={items} onItemToggle={onItemToggle} />
  </div>
);
