"use client";

import type { TagTone } from "@/components/elements/Tag";
import { Tag } from "@/components/elements/Tag";
import { cx } from "@/lib/classNames";

export interface TagItem {
  id: string;
  label: string;
  tone?: TagTone;
}

export interface MapTagProps {
  className?: string;
  items: TagItem[];
  onRemove?: (id: string) => void;
}

export const MapTag = ({ className, items, onRemove }: MapTagProps) => (
  <div className={cx("flex flex-wrap gap-2", className)}>
    {items.map((item) => (
      <Tag
        key={item.id}
        tone={item.tone}
        onRemove={onRemove ? () => onRemove(item.id) : undefined}
      >
        {item.label}
      </Tag>
    ))}
  </div>
);
