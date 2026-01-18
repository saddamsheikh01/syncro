"use client";

import { PostMediaThumbnail } from "@/features/social/elements/PostMediaThumbnail";
import { cx } from "@/lib/classNames";

export interface PostMediaItem {
  id: string;
  src?: string;
  label?: string;
  duration?: string;
  isVideo?: boolean;
  selected?: boolean;
  disabled?: boolean;
}

export interface MapPostMediaThumbnailProps {
  className?: string;
  items: PostMediaItem[];
  onItemPress?: (id: string) => void;
}

export const MapPostMediaThumbnail = ({
  className,
  items,
  onItemPress,
}: MapPostMediaThumbnailProps) => (
  <div className={cx("flex gap-3 overflow-x-auto pb-1", className)}>
    {items.map((item) => (
      <PostMediaThumbnail
        key={item.id}
        src={item.src}
        label={item.label}
        duration={item.duration}
        isVideo={item.isVideo}
        selected={item.selected}
        disabled={item.disabled}
        onClick={() => onItemPress?.(item.id)}
      />
    ))}
  </div>
);
