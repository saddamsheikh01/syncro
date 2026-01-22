"use client";

import { useEffect, useMemo, useState } from "react";
import type { HTMLAttributes } from "react";
import { Card } from "@/components/elements/Card";
import { Loader } from "@/components/elements/Loader";
import { PostHeader } from "@/features/social/elements/PostHeader";
import { PostActionBar } from "@/features/social/sections/PostActionBar";
import { PostMediaCarousel } from "@/features/social/sections/PostMediaCarousel";
import type { PostMediaItem } from "@/features/social/lists/MapPostMediaThumbnail";
import { getPostMedia } from "@/services/media";
import type { MediaResponse } from "@/types/media";
import type { PostResponse } from "@/types/social";
import { cx } from "@/lib/classNames";

const LIKE_ICON = (
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

const mapMediaToItems = (media: MediaResponse[]): PostMediaItem[] =>
  media.map((item, index) => ({
    id: item.id,
    src: item.url,
    label: item.mediaType === "VIDEO" ? "Video" : `Foto ${index + 1}`,
    isVideo: item.mediaType === "VIDEO",
    selected: index === 0,
  }));

export interface PostCardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  post: PostResponse;
  authorName?: string;
  authorSubtitle?: string;
  locationLabel?: string;
  avatarUrl?: string;
  matchScore?: number;
  showMedia?: boolean;
  mediaLimit?: number;
  onLike?: (postId: string) => void;
  onUnlike?: (postId: string) => void;
}

const formatPostDate = (isoDate?: string | null) => {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatCoordinate = (value: number | null | undefined) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "";
  return value.toFixed(4);
};

const buildLocationLabel = (
  latitude: number | null | undefined,
  longitude: number | null | undefined
) => {
  const lat = formatCoordinate(latitude);
  const lng = formatCoordinate(longitude);
  if (!lat && !lng) return "";
  if (lat && lng) return `Posizione: ${lat}, ${lng}`;
  return `Posizione: ${lat || lng}`;
};

export const PostCard = ({
  className,
  post,
  authorName = "Utente Syncro",
  authorSubtitle,
  locationLabel,
  avatarUrl,
  matchScore,
  showMedia = true,
  mediaLimit = 4,
  onLike,
  onUnlike,
  ...props
}: PostCardProps) => {
  const [mediaItems, setMediaItems] = useState<PostMediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  useEffect(() => {
    if (!showMedia) return;
    let active = true;
    const frame = requestAnimationFrame(() => {
      if (!active) return;
      setMediaItems([]);
      setMediaError(null);
      setMediaLoading(true);
    });

    getPostMedia({ postId: post.id, page: 0, size: mediaLimit })
      .then((response) => {
        if (!active) return;
        setMediaItems(mapMediaToItems(response.content));
      })
      .catch(() => {
        if (!active) return;
        setMediaError("Errore durante il caricamento dei media.");
      })
      .finally(() => {
        if (!active) return;
        setMediaLoading(false);
      });

    return () => {
      active = false;
      cancelAnimationFrame(frame);
    };
  }, [mediaLimit, post.id, showMedia]);

  const createdDate = formatPostDate(post.createdAt);
  const resolvedLocationLabel =
    typeof locationLabel === "string" && locationLabel.trim().length > 0
      ? locationLabel
      : buildLocationLabel(post.latitude, post.longitude);
  const displayedContent = post.content;

  const actions = useMemo(
    () => [
      {
        id: "like",
        label: "Like",
        count: post.likeCount,
        active: post.likedByMe,
        icon: LIKE_ICON,
        variant: "like" as const,
      },
    ],
    [post.likeCount, post.likedByMe]
  );

  const handleActionToggle = (id: string, nextActive: boolean) => {
    if (id !== "like") return;
    if (nextActive) {
      onLike?.(post.id);
    } else {
      onUnlike?.(post.id);
    }
  };

  return (
    <Card className={cx("space-y-4 p-5", className)} {...props}>
      <PostHeader
        name={authorName}
        subtitle={authorSubtitle}
        timeLabel={createdDate || undefined}
        avatarUrl={avatarUrl ?? undefined}
        matchScore={matchScore}
      />

      <div className="space-y-1">
        <p className="whitespace-pre-line text-sm text-foreground">
          {displayedContent}
        </p>
        {resolvedLocationLabel ? (
          <p className="text-xs text-subtle">{resolvedLocationLabel}</p>
        ) : null}
      </div>

      {showMedia && mediaLoading ? (
        <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border/60 bg-surface-muted px-4 py-4">
          <Loader size="sm" />
          <span className="text-sm text-muted">Caricamento media...</span>
        </div>
      ) : null}

      {showMedia && mediaItems.length ? (
        <PostMediaCarousel
          items={mediaItems}
          aspectClassName="aspect-[4/5] sm:aspect-[3/4] lg:aspect-[16/9] lg:max-h-[520px]"
        />
      ) : null}

      {showMedia && mediaError ? (
        <p className="text-xs text-danger">{mediaError}</p>
      ) : null}

      <PostActionBar
        actions={actions}
        onActionToggle={handleActionToggle}
      />
    </Card>
  );
};
