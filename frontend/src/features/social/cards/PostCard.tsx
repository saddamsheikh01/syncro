"use client";

import { useEffect, useId, useMemo, useState } from "react";
import type { ChangeEvent, HTMLAttributes } from "react";
import { Card } from "@/components/elements/Card";
import { Loader } from "@/components/elements/Loader";
import { Badge } from "@/components/elements/Badge";
import { PostHeader } from "@/features/social/elements/PostHeader";
import { PostActionBar } from "@/features/social/sections/PostActionBar";
import { SharePostDropdown } from "@/features/social/sections/SharePostDropdown";
import { PostCommentSection } from "@/features/social/sections/PostCommentSection";
import { PostMediaCarousel } from "@/features/social/sections/PostMediaCarousel";
import type { PostMediaItem } from "@/features/social/lists/MapPostMediaThumbnail";
import { getPostMedia } from "@/services/media";
import type { MediaResponse } from "@/types/media";
import type {
  PostMediaPreviewResponse,
  PostReactionType,
  PostResponse,
} from "@/types/social";
import { cx } from "@/lib/classNames";
import { getRuntimeBcp47 } from "@/i18n/runtimeLocale";
import { useT } from "@/hooks";

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

const REACTION_OPTIONS: { type: PostReactionType; emoji: string; labelKey: string }[] = [
  { type: "LIKE", emoji: "👍", labelKey: "Like" },
  { type: "LOVE", emoji: "❤️", labelKey: "Love" },
  { type: "LAUGH", emoji: "😂", labelKey: "Funny" },
  { type: "WOW", emoji: "😮", labelKey: "Wow" },
  { type: "SUPPORT", emoji: "🙌", labelKey: "Support" },
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

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_MEDIA_FILES = 6;
const ALLOWED_TYPES = ["image/", "video/"];

const formatFileSize = (bytes: number) => {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};

const formatDateLabel = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(getRuntimeBcp47(), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const mapMediaToItems = (media: MediaResponse[]): PostMediaItem[] =>
  media.map((item, index) => ({
    id: item.id,
    src: item.url,
    label: item.mediaType === "VIDEO" ? "Video" : `Foto ${index + 1}`,
    isVideo: item.mediaType === "VIDEO",
    selected: index === 0,
  }));

const mapPreviewMediaToItems = (
  media: PostMediaPreviewResponse[]
): PostMediaItem[] =>
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
  onEditPost?: (postId: string, payload: { content: string; mediaToDelete?: string[]; newFiles?: File[] }) => Promise<void> | void;
  onDeletePost?: (postId: string) => Promise<void> | void;
}

const formatPostDate = (isoDate?: string | null) => {
  if (!isoDate) return "";
  return formatDateLabel(isoDate);
};

const formatCoordinate = (value: number | null | undefined) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "";
  return value.toFixed(4);
};

const buildLocationLabel = (
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  t: (key: string, values?: Record<string, string | number>) => string
) => {
  const lat = formatCoordinate(latitude);
  const lng = formatCoordinate(longitude);
  if (!lat && !lng) return "";
  if (lat && lng) {
    return t("Location: {lat}, {lng}", { lat, lng });
  }
  return t("Location: {value}", { value: lat || lng });
};

export const PostCard = ({
  className,
  post,
  authorName,
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
  onEditPost,
  onDeletePost,
  ...props
}: PostCardProps) => {
  const { t } = useT();

  const resolvedAuthorName = authorName ?? t("Syncro user");
  const [fetchedMediaItems, setFetchedMediaItems] = useState<PostMediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editMediaToDelete, setEditMediaToDelete] = useState<string[]>([]);
  const [editNewFiles, setEditNewFiles] = useState<File[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [manageError, setManageError] = useState<string | null>(null);
  const editFileInputId = useId();

  const previewMediaItems = useMemo(() => {
    if (!Array.isArray(post.media)) return null;
    return mapPreviewMediaToItems(post.media.slice(0, mediaLimit));
  }, [mediaLimit, post.media]);

  const mediaItems = previewMediaItems ?? fetchedMediaItems;
  const isOwner = Boolean(currentUserId && currentUserId === post.userId);
  const canManagePost = isOwner && (Boolean(onEditPost) || Boolean(onDeletePost));

  useEffect(() => {
    if (!showMedia) return;
    if (previewMediaItems !== null) {
      return;
    }
    let active = true;
    const frame = requestAnimationFrame(() => {
      if (!active) return;
      setFetchedMediaItems([]);
      setMediaError(null);
      setMediaLoading(true);
    });

    getPostMedia({ postId: post.id, page: 0, size: mediaLimit })
      .then((response) => {
        if (!active) return;
        setFetchedMediaItems(mapMediaToItems(response.content));
      })
      .catch(() => {
        if (!active) return;
        setMediaError(t("Error while loading media."));
      })
      .finally(() => {
        if (!active) return;
        setMediaLoading(false);
      });

    return () => {
      active = false;
      cancelAnimationFrame(frame);
    };
  }, [mediaLimit, post.id, previewMediaItems, showMedia]);

  const createdDate = formatPostDate(post.createdAt);
  const resolvedLocationLabel =
    typeof locationLabel === "string" && locationLabel.trim().length > 0
      ? locationLabel
      : buildLocationLabel(post.latitude, post.longitude, t);
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
        label: post.myReaction ? t("Reaction") : t("React"),
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
        label: t("Comment"),
        count: commentCount,
        active: showComments,
        icon: COMMENT_ICON,
        variant: "default" as const,
      },
      {
        id: "favorite",
        label: post.favoritedByMe ? t("Saved") : t("Save"),
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
      t,
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

  const handleStartEdit = () => {
    if (!onEditPost) return;
    setManageError(null);
    setEditContent(post.content);
    setEditMediaToDelete([]);
    setEditNewFiles([]);
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setManageError(null);
    setEditContent(post.content);
    setEditMediaToDelete([]);
    setEditNewFiles([]);
  };

  const handleSaveEdit = async () => {
    if (!onEditPost) return;
    const trimmed = editContent.trim();
    if (!trimmed) {
      setManageError(t("Write something before saving."));
      return;
    }
    setEditLoading(true);
    setManageError(null);
    try {
      await onEditPost(post.id, {
        content: trimmed,
        mediaToDelete: editMediaToDelete.length ? editMediaToDelete : undefined,
        newFiles: editNewFiles.length ? editNewFiles : undefined,
      });
      setEditing(false);
      setEditContent(trimmed);
      setEditMediaToDelete([]);
      setEditNewFiles([]);
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String(
              (error as { message?: string }).message ??
                t("Unable to update post.")
            )
          : t("Unable to update post.");
      setManageError(message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!onDeletePost || deleteLoading) return;
    if (!window.confirm(t("Delete this post permanently?"))) return;
    setDeleteLoading(true);
    setManageError(null);
    try {
      await onDeletePost(post.id);
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String(
              (error as { message?: string }).message ??
                t("Unable to delete post.")
            )
          : t("Unable to delete post.");
      setManageError(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const existingMediaKept = useMemo(() => {
    if (!Array.isArray(post.media)) return [];
    return post.media.filter((m) => !editMediaToDelete.includes(m.id));
  }, [post.media, editMediaToDelete]);

  const totalEditMedia = existingMediaKept.length + editNewFiles.length;

  const handleMarkMediaForDelete = (mediaId: string) => {
    setEditMediaToDelete((prev) => [...prev, mediaId]);
  };

  const handleUndoMediaDelete = (mediaId: string) => {
    setEditMediaToDelete((prev) => prev.filter((id) => id !== mediaId));
  };

  const handleEditFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList) return;
    const incoming = Array.from(fileList);
    const errors: string[] = [];
    const accepted: File[] = [];

    for (const file of incoming) {
      if (!ALLOWED_TYPES.some((t) => file.type.startsWith(t))) {
        errors.push(
          t("{file}: unsupported format.", { file: file.name })
        );
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(
          t("{file}: exceeds {max} MB.", {
            file: file.name,
            max: MAX_FILE_SIZE_MB,
          })
        );
        continue;
      }
      accepted.push(file);
    }

    const remaining = MAX_MEDIA_FILES - totalEditMedia;
    if (accepted.length > remaining) {
      errors.push(
        t("Max {max} files allowed. Only {remaining} more can be added.", {
          max: MAX_MEDIA_FILES,
          remaining,
        })
      );
      accepted.splice(remaining);
    }

    if (accepted.length) {
      setEditNewFiles((prev) => [...prev, ...accepted]);
    }
    if (errors.length) {
      setManageError(errors.join(" "));
    }

    event.target.value = "";
  };

  const handleRemoveNewFile = (index: number) => {
    setEditNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Card className={cx("space-y-4 p-5", className)} {...props}>
      <PostHeader
        name={resolvedAuthorName}
        subtitle={authorSubtitle}
        timeLabel={createdDate || undefined}
        avatarUrl={avatarUrl ?? undefined}
        matchScore={matchScore}
        onProfileClick={onProfileClick}
      />

      {canManagePost ? (
        <div className="flex flex-wrap items-center gap-2">
          {onEditPost ? (
            <button
              type="button"
              onClick={editing ? handleCancelEdit : handleStartEdit}
              className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground hover:border-border-strong"
              disabled={editLoading || deleteLoading}
            >
              {editing ? t("Cancel edit") : t("Edit post")}
            </button>
          ) : null}
          {onDeletePost ? (
            <button
              type="button"
              onClick={handleDeletePost}
              className="inline-flex items-center rounded-full border border-danger/30 bg-danger/10 px-3 py-1 text-xs font-semibold text-danger hover:bg-danger/15"
              disabled={editLoading || deleteLoading}
            >
              {deleteLoading ? t("Deleting...") : t("Delete post")}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-1">
        {editing ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(event) => setEditContent(event.target.value)}
              rows={4}
              className="w-full rounded-[var(--radius-md)] border border-border/70 bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent/50"
            />

            {/* Existing media thumbnails */}
            {Array.isArray(post.media) && post.media.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-subtle">
                  {t("Current media")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {post.media.map((m) => {
                    const markedForDelete = editMediaToDelete.includes(m.id);
                    return (
                      <div key={m.id} className="relative">
                        <div
                          className={cx(
                            "relative h-16 w-16 overflow-hidden rounded-[var(--radius-sm)] border border-border/70",
                            markedForDelete && "opacity-30"
                          )}
                        >
                          {m.mediaType === "VIDEO" ? (
                            <div className="flex h-full w-full items-center justify-center bg-surface-muted text-[10px] text-subtle">
                              {t("Video")}
                            </div>
                          ) : (
                            <img
                              src={m.url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        {markedForDelete ? (
                          <button
                            type="button"
                            onClick={() => handleUndoMediaDelete(m.id)}
                            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white shadow-sm"
                            title={t("Undo remove")}
                          >
                            +
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleMarkMediaForDelete(m.id)}
                            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white shadow-sm"
                            title={t("Remove media")}
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* New files list */}
            {editNewFiles.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-subtle">
                  {t("New files")}
                </p>
                <div className="space-y-1">
                  {editNewFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between rounded-[var(--radius-sm)] border border-border/70 bg-surface-muted px-3 py-1.5"
                    >
                      <span className="truncate text-xs text-foreground">
                        {file.name}{" "}
                        <span className="text-subtle">({formatFileSize(file.size)})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewFile(index)}
                        className="ml-2 text-xs font-semibold text-danger hover:text-danger/80"
                      >
                        {t("Remove")}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add media button */}
            {totalEditMedia < MAX_MEDIA_FILES && (
              <div>
                <label
                  htmlFor={editFileInputId}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground hover:border-border-strong"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                  {t("Add media")}
                </label>
                <input
                  id={editFileInputId}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleEditFileChange}
                  className="hidden"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground hover:border-border-strong"
                disabled={editLoading}
              >
                {t("Cancel")}
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
                disabled={editLoading}
              >
                {editLoading ? t("Saving...") : t("Save")}
              </button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-line text-sm text-foreground">
            {displayedContent}
          </p>
        )}
        {resolvedLocationLabel ? (
          <p className="text-xs text-subtle">{resolvedLocationLabel}</p>
        ) : null}
      </div>

      {manageError ? <p className="text-xs text-danger">{manageError}</p> : null}

      {(scopeLabel || moodLabel || timeframeLabel) && (
        <div className="flex flex-wrap gap-2">
          {scopeLabel ? (
            <Badge tone="accent" size="sm">
              {t(scopeLabel)}
            </Badge>
          ) : null}
          {moodLabel ? (
            <Badge tone="neutral" size="sm">
              {moodLabel}
            </Badge>
          ) : null}
          {timeframeLabel ? (
            <Badge tone="neutral" size="sm">
              {t(timeframeLabel)}
            </Badge>
          ) : null}
        </div>
      )}

      {post.taggedUsers?.length ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-subtle">
          <span className="font-semibold text-foreground">{t("With:")}</span>
          {post.taggedUsers.map((user) => (
            <span
              key={user.userId}
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-surface px-2 py-1 text-[11px] text-foreground"
            >
              {user.fullName ?? user.username ?? t("User")}
            </span>
          ))}
        </div>
      ) : null}

      {showMedia && mediaLoading ? (
        <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border/70 bg-surface-muted px-4 py-4">
          <Loader size="sm" />
          <span className="text-sm text-muted">{t("Loading media...")}</span>
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
                <span>{t(reaction.labelKey)}</span>
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
              {t("Remove reaction")}
            </button>
          ) : null}
        </div>
      ) : null}

      <PostActionBar
        actions={actions}
        onActionToggle={handleActionToggle}
        rightSlot={
          <SharePostDropdown postId={post.id} postContent={post.content} />
        }
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
