"use client";

import type { HTMLAttributes } from "react";
import { Card } from "@/components/elements/Card";
import { MapPostMediaThumbnail } from "@/features/social/lists/MapPostMediaThumbnail";
import type { PostMediaItem } from "@/features/social/lists/MapPostMediaThumbnail";
import { useT } from "@/hooks";
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
}: PostMediaStripProps) => {
  const { t } = useT();
  const resolvedTitle = title ? t(title) : null;
  const resolvedSubtitle = subtitle ? t(subtitle) : null;

  return (
    <Card className={cx("space-y-3 p-4", className)} {...props}>
      {resolvedTitle ? (
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-foreground">{resolvedTitle}</h4>
          {resolvedSubtitle ? (
            <p className="text-xs text-subtle">{resolvedSubtitle}</p>
          ) : null}
        </div>
      ) : null}
      <MapPostMediaThumbnail items={items} onItemPress={onItemPress} />
    </Card>
  );
};
