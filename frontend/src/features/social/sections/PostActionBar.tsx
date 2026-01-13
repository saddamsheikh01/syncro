"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { MapPostActionButton } from "@/features/social/lists/MapPostActionButton";
import type { PostActionItem } from "@/features/social/lists/MapPostActionButton";
import { cx } from "@/lib/classNames";

export interface PostActionBarProps extends HTMLAttributes<HTMLDivElement> {
  actions: PostActionItem[];
  rightSlot?: ReactNode;
  onActionToggle?: (id: string, nextActive: boolean) => void;
}

export const PostActionBar = ({
  className,
  actions,
  rightSlot,
  onActionToggle,
  ...props
}: PostActionBarProps) => (
  <div
    className={cx(
      "flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-card px-3 py-2 shadow-sm",
      className
    )}
    {...props}
  >
    <MapPostActionButton items={actions} onItemToggle={onActionToggle} />
    {rightSlot ? <div className="flex items-center gap-2">{rightSlot}</div> : null}
  </div>
);
