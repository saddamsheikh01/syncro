"use client";

import { PostActionButton } from "@/features/social/elements/PostActionButton";
import { cx } from "@/lib/classNames";
import type { ReactNode } from "react";

export interface PostActionItem {
  id: string;
  label: string;
  count?: number;
  icon?: ReactNode;
  active?: boolean;
  disabled?: boolean;
}

export interface MapPostActionButtonProps {
  className?: string;
  items: PostActionItem[];
  onItemToggle?: (id: string, nextActive: boolean) => void;
}

export const MapPostActionButton = ({
  className,
  items,
  onItemToggle,
}: MapPostActionButtonProps) => (
  <div className={cx("flex flex-wrap items-center gap-2", className)}>
    {items.map((item) => (
      <PostActionButton
        key={item.id}
        label={item.label}
        count={item.count}
        icon={item.icon}
        active={item.active}
        disabled={item.disabled}
        onToggleState={(nextActive) => onItemToggle?.(item.id, nextActive)}
      />
    ))}
  </div>
);
