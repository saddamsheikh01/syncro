"use client";

import { PostCard } from "@/features/social/cards/PostCard";
import type { PostCardProps } from "@/features/social/cards/PostCard";
import { cx } from "@/lib/classNames";

export interface MapPostCardProps {
  className?: string;
  items: PostCardProps[];
}

export const MapPostCard = ({ className, items }: MapPostCardProps) => (
  <div className={cx("flex flex-col gap-6", className)}>
    {items.map((item) => (
      <PostCard key={item.post.id} {...item} />
    ))}
  </div>
);
