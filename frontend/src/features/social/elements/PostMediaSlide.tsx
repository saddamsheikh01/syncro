"use client";

import type { HTMLAttributes } from "react";
import { cx } from "@/lib/classNames";

export interface PostMediaSlideProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  label?: string;
  isVideo?: boolean;
}

export const PostMediaSlide = ({
  className,
  src,
  label,
  isVideo,
  ...props
}: PostMediaSlideProps) => (
  <div
    className={cx(
      "relative overflow-hidden rounded-[var(--radius-lg)] border border-border/70 bg-surface-muted",
      className
    )}
    {...props}
  >
    {src ? (
      <img
        src={src}
        alt={label ?? "Media"}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center text-xs text-subtle">
        {label ?? (isVideo ? "Video" : "Media")}
      </div>
    )}
    {isVideo ? (
      <span className="absolute left-3 top-3 rounded-full bg-foreground/80 px-2 py-1 text-[10px] font-semibold text-white">
        Video
      </span>
    ) : null}
  </div>
);
