"use client";

import { useCallback, useEffect, useState } from "react";
import { Avatar } from "@/components/elements/Avatar";
import { Button } from "@/components/buttons/Button";
import { Loader } from "@/components/elements/Loader";
import { getComments, createComment, deleteComment } from "@/services/social";
import type { CommentResponse } from "@/types/social";
import { cx } from "@/lib/classNames";

const MAX_COMMENT_LENGTH = 100;

const formatCommentDate = (isoDate: string) => {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "ora";
  if (diffMinutes < 60) return `${diffMinutes} min`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}g`;
  return date.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" });
};

export interface PostCommentSectionProps {
  postId: string;
  currentUserId?: string;
  onCommentCountChange?: (count: number) => void;
}

export const PostCommentSection = ({
  postId,
  currentUserId,
  onCommentCountChange,
}: PostCommentSectionProps) => {
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);

  const loadComments = useCallback(async (pageNum: number, append = false) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getComments(postId, { page: pageNum, size: 10 });

      if (append) {
        setComments((prev) => [...prev, ...response.content]);
      } else {
        setComments(response.content);
      }
      setHasMore(pageNum < response.totalPages - 1);
      setPage(pageNum);
    } catch {
      setError("Errore nel caricamento dei commenti.");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadComments(0);
  }, [loadComments]);

  const handleSubmit = async () => {
    const trimmed = newComment.trim();
    if (!trimmed || trimmed.length > MAX_COMMENT_LENGTH) return;

    setSubmitting(true);
    setError(null);

    try {
      const created = await createComment(postId, { content: trimmed });
      setComments((prev) => [created, ...prev]);
      setNewComment("");
      onCommentCountChange?.(comments.length + 1);
    } catch {
      setError("Errore nell'invio del commento.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(postId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onCommentCountChange?.(Math.max(0, comments.length - 1));
    } catch {
      setError("Errore nell'eliminazione del commento.");
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadComments(page + 1, true);
    }
  };

  const remainingChars = MAX_COMMENT_LENGTH - newComment.length;
  const isOverLimit = remainingChars < 0;

  return (
    <div className="space-y-3 border-t border-border/40 pt-3">
      {/* Input commento */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Scrivi un commento..."
            maxLength={MAX_COMMENT_LENGTH + 10}
            disabled={submitting}
            className="flex-1 rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !isOverLimit) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!newComment.trim() || isOverLimit || submitting}
            loading={submitting}
          >
            Invia
          </Button>
        </div>
        <div className="flex justify-end">
          <span
            className={cx(
              "text-[11px]",
              isOverLimit ? "text-danger" : remainingChars <= 20 ? "text-warning" : "text-subtle"
            )}
          >
            {remainingChars} caratteri
          </span>
        </div>
      </div>

      {/* Errore */}
      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}

      {/* Lista commenti */}
      {loading && comments.length === 0 ? (
        <div className="flex items-center gap-2 py-2">
          <Loader size="sm" />
          <span className="text-sm text-muted">Caricamento commenti...</span>
        </div>
      ) : comments.length === 0 ? (
        <p className="py-2 text-center text-xs text-subtle">
          Nessun commento. Sii il primo a commentare!
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <Avatar
                name={comment.userFullName ?? comment.username ?? "Utente"}
                src={comment.userAvatarUrl ?? undefined}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    {comment.userFullName ?? comment.username ?? "Utente"}
                  </span>
                  <span className="text-[11px] text-subtle">
                    {formatCommentDate(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-foreground">{comment.content}</p>
                {currentUserId === comment.userId && (
                  <button
                    type="button"
                    onClick={() => handleDelete(comment.id)}
                    className="mt-1 text-[11px] text-subtle hover:text-danger"
                  >
                    Elimina
                  </button>
                )}
              </div>
            </div>
          ))}

          {hasMore && (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loading}
              className="w-full py-2 text-center text-xs font-semibold text-accent hover:underline disabled:opacity-60"
            >
              {loading ? "Caricamento..." : "Mostra altri commenti"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
