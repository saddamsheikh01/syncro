"use client";

import type { ButtonHTMLAttributes, MouseEvent } from "react";
import { cx } from "@/lib/classNames";

export interface PostMediaThumbnailProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  className?: string;
  src?: string;
  label?: string;
  duration?: string;
  isVideo?: boolean;
  selected?: boolean;
}

export const PostMediaThumbnail = ({
  className,
  src,
  label,
  duration,
  isVideo,
  selected,
  disabled,
  onClick,
  ...props
}: PostMediaThumbnailProps) => {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    onClick?.(event);
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={cx(
        "relative h-24 w-32 overflow-hidden rounded-[var(--radius-md)] border bg-surface-muted text-left transition",
        selected ? "border-accent/50 shadow-sm" : "border-border",
        "hover:border-border-strong",
        disabled && "cursor-not-allowed opacity-60",
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
        <span className="flex h-full w-full items-center justify-center text-xs text-subtle">
          {label ?? (isVideo ? "Video" : "Media")}
        </span>
      )}
      {isVideo && duration ? (
        <span className="absolute bottom-2 left-2 rounded-full bg-foreground/80 px-2 py-0.5 text-[10px] font-semibold text-white">
          {duration}
        </span>
      ) : null}
    </button>
  );
};
