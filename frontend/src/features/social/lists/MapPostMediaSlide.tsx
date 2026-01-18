"use client";

import { PostMediaSlide } from "@/features/social/elements/PostMediaSlide";
import type { PostMediaItem } from "@/features/social/lists/MapPostMediaThumbnail";
import { cx } from "@/lib/classNames";

export interface MapPostMediaSlideProps {
  className?: string;
  slideClassName?: string;
  items: PostMediaItem[];
  onSlideClick?: (id: string) => void;
}

export const MapPostMediaSlide = ({
  className,
  slideClassName,
  items,
  onSlideClick,
}: MapPostMediaSlideProps) => (
  <div className={cx("flex items-center gap-0", className)}>
    {items.map((item) => (
      <PostMediaSlide
        key={item.id}
        src={item.src}
        label={item.label}
        isVideo={item.isVideo}
        className={slideClassName}
        onClick={() => onSlideClick?.(item.id)}
      />
    ))}
  </div>
);
