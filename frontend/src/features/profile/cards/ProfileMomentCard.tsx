"use client";

import { useEffect, useMemo, useState } from "react";
import type { HTMLAttributes } from "react";
import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";
import { getPostMedia } from "@/services/media";
import type { PostResponse } from "@/types/social";

const LikeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
    aria-hidden="true"
  >
    <path d="M20.8 8.6c0 4.1-4.6 7.6-8.8 11.1C7.8 16.2 3.2 12.7 3.2 8.6c0-2.3 1.8-4.1 4.1-4.1 1.7 0 3.2 1 3.8 2.4 0.6-1.4 2.1-2.4 3.8-2.4 2.3 0 4.1 1.8 4.1 4.1z" />
  </svg>
);

const CommentIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
    aria-hidden="true"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export interface ProfileMomentCardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  post: PostResponse;
}

const buildTitle = (content: string) => {
  const trimmed = content.trim();
  if (!trimmed) return "Moment";
  return trimmed.length > 36 ? `${trimmed.slice(0, 36)}...` : trimmed;
};

const buildDescription = (content: string) => {
  const trimmed = content.trim();
  if (trimmed.length <= 36) return "";
  return trimmed.slice(36, 120).trim();
};

export const ProfileMomentCard = ({
  className,
  post,
  ...props
}: ProfileMomentCardProps) => {
  const [fetchedCoverUrl, setFetchedCoverUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const previewCoverUrl =
    Array.isArray(post.media) ? (post.media[0]?.url ?? null) : undefined;
  const coverUrl = previewCoverUrl !== undefined ? previewCoverUrl : fetchedCoverUrl;
  const coverLoading = previewCoverUrl !== undefined ? false : loading;

  useEffect(() => {
    if (previewCoverUrl !== undefined) {
      return;
    }

    let active = true;
    const frame = requestAnimationFrame(() => {
      if (!active) return;
      setFetchedCoverUrl(null);
      setLoading(true);
    });
    getPostMedia({ postId: post.id, page: 0, size: 1 })
      .then((response) => {
        if (!active) return;
        setFetchedCoverUrl(response.content[0]?.url ?? null);
      })
      .catch(() => {
        if (!active) return;
        setFetchedCoverUrl(null);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
      cancelAnimationFrame(frame);
    };
  }, [post.id, previewCoverUrl]);

  const title = useMemo(() => buildTitle(post.content ?? ""), [post.content]);
  const description = useMemo(
    () => buildDescription(post.content ?? ""),
    [post.content]
  );

  return (
    <Card
      className={cx("overflow-hidden border border-border/70 bg-card", className)}
      {...props}
    >
      <div className="h-44 w-full overflow-hidden bg-surface-muted">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-muted text-xs text-subtle">
            {coverLoading ? "Loading..." : "No image"}
          </div>
        )}
      </div>
      <div className="space-y-2 p-4">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {description ? (
          <p className="line-clamp-2 text-xs text-muted">{description}</p>
        ) : null}
        <div className="flex items-center gap-6 text-xs text-subtle">
          <span className="flex items-center gap-1">
            <LikeIcon />
            {post.likeCount ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <CommentIcon />
            {post.commentCount ?? 0}
          </span>
        </div>
      </div>
    </Card>
  );
};
