"use client";

import { useEffect, useMemo, useState } from "react";
import type { HTMLAttributes } from "react";
import { Card } from "@/components/elements/Card";
import { Loader } from "@/components/elements/Loader";
import { Badge } from "@/components/elements/Badge";
import { PostHeader } from "@/features/social/elements/PostHeader";
import { PostActionBar } from "@/features/social/sections/PostActionBar";
import { PostCommentSection } from "@/features/social/sections/PostCommentSection";
import { PostMediaCarousel } from "@/features/social/sections/PostMediaCarousel";
import type { PostMediaItem } from "@/features/social/lists/MapPostMediaThumbnail";
import { getPostMedia } from "@/services/media";
import type { MediaResponse } from "@/types/media";
import type { PostReactionType, PostResponse } from "@/types/social";
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

const COMMENT_ICON = (
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

const FAVORITE_ICON = (
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
    <path d="M11.1 3.2c.3-.6 1.1-.6 1.4 0l2.4 4.9 5.4.8c.7.1 1 .9.5 1.4l-3.9 3.8.9 5.4c.1.7-.6 1.2-1.2.9l-4.8-2.5-4.8 2.5c-.6.3-1.3-.2-1.2-.9l.9-5.4-3.9-3.8c-.5-.5-.2-1.3.5-1.4l5.4-.8 2.4-4.9z" />
  </svg>
);

const REACTION_OPTIONS: { type: PostReactionType; emoji: string; label: string }[] = [
  { type: "LIKE", emoji: "👍", label: "Like" },
  { type: "LOVE", emoji: "❤️", label: "Love" },
  { type: "LAUGH", emoji: "😂", label: "Funny" },
  { type: "WOW", emoji: "😮", label: "Wow" },
  { type: "SUPPORT", emoji: "🙌", label: "Support" },
];

const SCOPE_LABELS: Record<string, string> = {
  AMICIZIA: "Friendship",
  ESPERIENZE: "Experiences",
  LAVORO: "Work",
  BENESSERE: "Wellness",
};

const TIMEFRAME_LABELS: Record<string, string> = {
  ORA: "Now",
  OGGI: "Today",
};

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
  currentUserId?: string;
  onProfileClick?: () => void;
  onReact?: (postId: string, reaction: PostReactionType) => void;
  onRemoveReaction?: (postId: string) => void;
  onToggleFavorite?: (postId: string, nextActive: boolean) => void;
  onCommentCountChange?: (postId: string, count: number) => void;
}

const formatPostDate = (isoDate?: string | null) => {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
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
  if (lat && lng) return `Location: ${lat}, ${lng}`;
  return `Location: ${lat || lng}`;
};

export const PostCard = ({
  className,
  post,
  authorName = "Syncro user",
  authorSubtitle,
  locationLabel,
  avatarUrl,
  matchScore,
  showMedia = true,
  mediaLimit = 4,
  currentUserId,
  onProfileClick,
  onReact,
  onRemoveReaction,
  onToggleFavorite,
  onCommentCountChange,
  ...props
}: PostCardProps) => {
  const [mediaItems, setMediaItems] = useState<PostMediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount);

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
        setMediaError("Error while loading media.");
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
  const reactionTotal = useMemo(() => {
    if (!post.reactions) return 0;
    return Object.values(post.reactions).reduce(
      (sum, value) => sum + (Number.isFinite(value) ? value : 0),
      0
    );
  }, [post.reactions]);
  const reactionEmoji =
    post.myReaction &&
    REACTION_OPTIONS.find((item) => item.type === post.myReaction)?.emoji;
  const scopeLabel = post.scope ? SCOPE_LABELS[post.scope] ?? post.scope : null;
  const moodLabel = post.mood
    ? post.mood.toLowerCase().replace(/_/g, " ")
    : null;
  const timeframeLabel = post.timeframe
    ? TIMEFRAME_LABELS[post.timeframe] ?? post.timeframe
    : null;

  const actions = useMemo(
    () => [
      {
        id: "reaction",
        label: post.myReaction ? "Reaction" : "React",
        count: reactionTotal,
        active: Boolean(post.myReaction),
        icon: reactionEmoji ? (
          <span className="text-sm">{reactionEmoji}</span>
        ) : (
          LIKE_ICON
        ),
        variant: "default" as const,
      },
      {
        id: "comment",
        label: "Comment",
        count: commentCount,
        active: showComments,
        icon: COMMENT_ICON,
        variant: "default" as const,
      },
      {
        id: "favorite",
        label: post.favoritedByMe ? "Saved" : "Save",
        active: post.favoritedByMe,
        icon: FAVORITE_ICON,
        variant: "default" as const,
      },
    ],
    [
      post.myReaction,
      post.favoritedByMe,
      reactionTotal,
      reactionEmoji,
      commentCount,
      showComments,
    ]
  );

  const handleActionToggle = (id: string, nextActive: boolean) => {
    if (id === "reaction") {
      setShowReactions((prev) => !prev);
      return;
    }
    if (id === "comment") {
      setShowComments(nextActive);
      return;
    }
    if (id === "favorite") {
      onToggleFavorite?.(post.id, nextActive);
    }
  };

  const handleCommentCountChange = (count: number) => {
    setCommentCount(count);
    onCommentCountChange?.(post.id, count);
  };

  return (
    <Card className={cx("space-y-4 p-5", className)} {...props}>
      <PostHeader
        name={authorName}
        subtitle={authorSubtitle}
        timeLabel={createdDate || undefined}
        avatarUrl={avatarUrl ?? undefined}
        matchScore={matchScore}
        onProfileClick={onProfileClick}
      />

      <div className="space-y-1">
        <p className="whitespace-pre-line text-sm text-foreground">
          {displayedContent}
        </p>
        {resolvedLocationLabel ? (
          <p className="text-xs text-subtle">{resolvedLocationLabel}</p>
        ) : null}
      </div>

      {(scopeLabel || moodLabel || timeframeLabel) && (
        <div className="flex flex-wrap gap-2">
          {scopeLabel ? (
            <Badge tone="accent" size="sm">
              {scopeLabel}
            </Badge>
          ) : null}
          {moodLabel ? (
            <Badge tone="neutral" size="sm">
              {moodLabel}
            </Badge>
          ) : null}
          {timeframeLabel ? (
            <Badge tone="neutral" size="sm">
              {timeframeLabel}
            </Badge>
          ) : null}
        </div>
      )}

      {post.taggedUsers?.length ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-subtle">
          <span className="font-semibold text-foreground">With:</span>
          {post.taggedUsers.map((user) => (
            <span
              key={user.userId}
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-surface px-2 py-1 text-[11px] text-foreground"
            >
              {user.fullName ?? user.username ?? "User"}
            </span>
          ))}
        </div>
      ) : null}

      {showMedia && mediaLoading ? (
        <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border/70 bg-surface-muted px-4 py-4">
          <Loader size="sm" />
          <span className="text-sm text-muted">Loading media...</span>
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

      {showReactions ? (
        <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-border/70 bg-surface-muted px-3 py-2">
          {REACTION_OPTIONS.map((reaction) => {
            const isActive = post.myReaction === reaction.type;
            return (
              <button
                key={reaction.type}
                type="button"
                onClick={() => {
                  onReact?.(post.id, reaction.type);
                  setShowReactions(false);
                }}
                className={cx(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                  isActive
                    ? "border-accent/40 bg-accent-soft text-accent"
                    : "border-border bg-surface text-foreground hover:border-border-strong"
                )}
              >
                <span className="text-sm">{reaction.emoji}</span>
                <span>{reaction.label}</span>
              </button>
            );
          })}
          {post.myReaction ? (
            <button
              type="button"
              onClick={() => {
                onRemoveReaction?.(post.id);
                setShowReactions(false);
              }}
              className="ml-auto text-[11px] font-semibold text-subtle hover:text-foreground"
            >
              Remove reaction
            </button>
          ) : null}
        </div>
      ) : null}

      <PostActionBar
        actions={actions}
        onActionToggle={handleActionToggle}
      />

      {showComments && (
        <PostCommentSection
          postId={post.id}
          currentUserId={currentUserId}
          onCommentCountChange={handleCommentCountChange}
        />
      )}
    </Card>
  );
};
