"use client";

import type { HTMLAttributes } from "react";
import { useT } from "@/hooks";
import { cx } from "@/lib/classNames";
import { resolveMediaUrl } from "@/lib/mediaUrl";

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
}: PostMediaSlideProps) => {
  const { t } = useT();
  const safeSrc = resolveMediaUrl(src);

  return (
    <div
      className={cx(
        "relative overflow-hidden rounded-[var(--radius-lg)] border border-border/70 bg-surface-muted",
        className
      )}
      {...props}
    >
      {safeSrc ? (
        isVideo ? (
          <video
            src={safeSrc}
            className="h-full w-full object-cover"
            controls
            playsInline
            preload="metadata"
          >
            {t("Your browser does not support this video format.")}
          </video>
        ) : (
          <img
            src={safeSrc}
            alt={label ?? t("Media")}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs text-subtle">
          {label ?? (isVideo ? t("Video") : t("Media"))}
        </div>
      )}
      {isVideo ? (
        <span className="absolute left-3 top-3 rounded-full bg-foreground/80 px-2 py-1 text-[10px] font-semibold text-white">
          {t("Video")}
        </span>
      ) : null}
    </div>
  );
};
