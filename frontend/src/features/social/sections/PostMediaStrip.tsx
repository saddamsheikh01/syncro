"use client";

import type { HTMLAttributes } from "react";
import { Card } from "@/components/elements/Card";
import { MapPostMediaThumbnail } from "@/features/social/lists/MapPostMediaThumbnail";
import type { PostMediaItem } from "@/features/social/lists/MapPostMediaThumbnail";
import { cx } from "@/lib/classNames";

export interface PostMediaStripProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: string;
  subtitle?: string;
  items: PostMediaItem[];
  onItemPress?: (id: string) => void;
}

export const PostMediaStrip = ({
  className,
  title = "Post media",
  subtitle,
  items,
  onItemPress,
  ...props
}: PostMediaStripProps) => (
  <Card className={cx("space-y-3 p-4", className)} {...props}>
    {title ? (
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {subtitle ? <p className="text-xs text-subtle">{subtitle}</p> : null}
      </div>
    ) : null}
    <MapPostMediaThumbnail items={items} onItemPress={onItemPress} />
  </Card>
);
