"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { PostCard } from "@/features/social/cards/PostCard";
import { useAuth, useT } from "@/hooks";
import { getPostById } from "@/services/social";
import { getUserProfile } from "@/services/users";
import {
  reactToPost,
  removeReaction,
} from "@/services/social";
import { addFavorite, removeFavorite } from "@/services/favorites";
import type { PostReactionType, PostResponse } from "@/types/social";
import type { UserPublicProfileResponse } from "@/types/profile";

export interface PostDetailViewProps {
  postId: string;
}

const updateReactionCounts = (
  reactions: PostResponse["reactions"],
  prevReaction: PostReactionType | null,
  nextReaction: PostReactionType | null
) => {
  const next = { ...(reactions ?? {}) } as Record<string, number>;
  if (prevReaction) {
    next[prevReaction] = Math.max(0, (next[prevReaction] ?? 0) - 1);
  }
  if (nextReaction) {
    next[nextReaction] = (next[nextReaction] ?? 0) + 1;
  }
  return next;
};

export const PostDetailView = ({ postId }: PostDetailViewProps) => {
  const router = useRouter();
  const { t } = useT();
  const { user } = useAuth();

  const [post, setPost] = useState<PostResponse | null>(null);
  const [author, setAuthor] = useState<UserPublicProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    getPostById(postId)
      .then((data) => {
        setPost(data);
        return getUserProfile(data.userId).catch(() => null);
      })
      .then((profile) => {
        if (profile) setAuthor(profile);
      })
      .catch(() => {
        setError(t("Unable to load this moment."));
      })
      .finally(() => setLoading(false));
  }, [postId, t]);

  const handleReact = useCallback(
    async (id: string, reaction: PostReactionType) => {
      setPost((prev) => {
        if (!prev || prev.id !== id) return prev;
        const prevReaction = prev.myReaction ?? null;
        return {
          ...prev,
          myReaction: reaction,
          reactions: updateReactionCounts(prev.reactions, prevReaction, reaction),
          likedByMe: reaction === "LIKE",
          likeCount:
            reaction === "LIKE"
              ? prev.likeCount + (prevReaction === "LIKE" ? 0 : 1)
              : prevReaction === "LIKE"
                ? Math.max(0, prev.likeCount - 1)
                : prev.likeCount,
        };
      });
      try {
        await reactToPost(id, reaction);
      } catch {
        /* revert handled by refetch if needed */
      }
    },
    []
  );

  const handleRemoveReaction = useCallback(async (id: string) => {
    setPost((prev) => {
      if (!prev || prev.id !== id) return prev;
      const prevReaction = prev.myReaction ?? null;
      return {
        ...prev,
        myReaction: null,
        reactions: updateReactionCounts(prev.reactions, prevReaction, null),
        likedByMe: false,
        likeCount:
          prevReaction === "LIKE"
            ? Math.max(0, prev.likeCount - 1)
            : prev.likeCount,
      };
    });
    try {
      await removeReaction(id);
    } catch {
      /* silent */
    }
  }, []);

  const handleToggleFavorite = useCallback(
    async (id: string, nextActive: boolean) => {
      setPost((prev) => {
        if (!prev || prev.id !== id) return prev;
        return { ...prev, favoritedByMe: nextActive };
      });
      try {
        if (nextActive) {
          await addFavorite({ postId: id });
        } else {
          await removeFavorite({ postId: id });
        }
      } catch {
        setPost((prev) => {
          if (!prev || prev.id !== id) return prev;
          return { ...prev, favoritedByMe: !nextActive };
        });
      }
    },
    []
  );

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">{t("Loading moment...")}</p>
        </Card>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <ErrorState
          title={t("Moment unavailable")}
          description={error ?? t("This moment does not exist or has been removed.")}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => router.back()}>
            {t("Go back")}
          </Button>
          <Button onClick={() => router.push("/moments")}>
            {t("Browse moments")}
          </Button>
        </div>
      </div>
    );
  }

  const authorName =
    author?.fullName?.trim() || author?.username || t("Syncro user");
  const locationParts = [author?.city, author?.country].filter(Boolean);
  const authorSubtitle = locationParts.length ? locationParts.join(", ") : undefined;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <button
        type="button"
        onClick={() => router.back()}
        className="self-start text-sm text-muted hover:text-foreground"
      >
        &larr; {t("Back")}
      </button>

      <PostCard
        post={post}
        authorName={authorName}
        authorSubtitle={authorSubtitle}
        avatarUrl={author?.avatarUrl ?? undefined}
        currentUserId={user?.id}
        onReact={handleReact}
        onRemoveReaction={handleRemoveReaction}
        onToggleFavorite={handleToggleFavorite}
        onProfileClick={() => router.push(`/profile/${post.userId}`)}
      />

      {!user && (
        <EmptyState
          title={t("Want to interact?")}
          description={t("Sign up or sign in to react, comment, and connect with the community.")}
        />
      )}
    </div>
  );
};
