"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/elements/Badge";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { MapPostCard } from "@/features/social/lists/MapPostCard";
import type { PostComposerPayload } from "@/features/social/sections/PostComposerModal";
import { PostComposerModal } from "@/features/social/sections/PostComposerModal";
import { useAuth, useFeed, usePosition, useUser } from "@/hooks";
import { uploadPostMedia } from "@/services/media";
import { createPost } from "@/services/social";
import { getUserSummary } from "@/services/users";
import type { JsonValue } from "@/types/shared";
import type { CreatePostRequest } from "@/types/social";
import type { UserSummaryResponse } from "@/types/profile";

const DEFAULT_PAGE_SIZE = 10;

const readNumber = (value: JsonValue | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const readBoolean = (value: JsonValue | undefined) =>
  typeof value === "boolean" ? value : undefined;

const formatAuthorName = (userId: string) => {
  if (!userId) return "Utente Syncro";
  return `Utente ${userId.slice(0, 6).toUpperCase()}`;
};

const formatCoordinate = (value: number | null | undefined) => {
  if (typeof value !== "number") return "";
  return value.toFixed(4);
};

const resolveErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: string }).message;
    if (message) return String(message);
  }
  return fallback;
};

export const Feed = () => {
  const router = useRouter();
  const { status, user, actions: authActions } = useAuth();
  const { preferences, profile, language, actions: userActions } = useUser();
  const {
    position,
    hasPosition,
    loading: positionLoading,
    actions: positionActions,
  } = usePosition();
  const {
    items,
    loading,
    error,
    page,
    hasMore,
    actions: feedActions,
  } = useFeed();
  const [authorSummaries, setAuthorSummaries] = useState<
    Record<string, UserSummaryResponse>
  >({});

  const bootstrappedRef = useRef(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerLoading, setComposerLoading] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [composerNotice, setComposerNotice] = useState<string | null>(null);

  useEffect(() => {
    authActions.hydrate();
  }, [authActions]);

  useEffect(() => {
    if (status !== "authenticated" || bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    userActions.fetchPreferences().catch(() => undefined);
    userActions.fetchProfile().catch(() => undefined);
    positionActions.hydrate();
    positionActions.fetchPosition().catch(() => undefined);
  }, [positionActions, status, userActions]);

  const feedFilters = useMemo(() => {
    const storedFeed = (preferences?.feedPreferences ?? {}) as Record<
      string,
      JsonValue
    >;
    const onlyNearby = readBoolean(storedFeed.onlyNearby) ?? true;
    const radiusKm = readNumber(storedFeed.radiusKm);

    if (onlyNearby && hasPosition && position) {
      return {
        lat: position.latitude ?? undefined,
        lng: position.longitude ?? undefined,
        radiusKm: radiusKm ?? undefined,
      };
    }

    return {};
  }, [hasPosition, position, preferences]);

  const feedFilterKey = useMemo(
    () => JSON.stringify(feedFilters),
    [feedFilters]
  );

  useEffect(() => {
    if (status !== "authenticated") return;
    feedActions.resetFeed();
    feedActions
      .fetchFeed({ ...feedFilters, page: 0, size: DEFAULT_PAGE_SIZE })
      .catch(() => undefined);
  }, [feedActions, feedFilterKey, feedFilters, status]);

  const postItems = useMemo(() => {
    const profileName = profile?.fullName?.trim();
    const selfName = profileName || user?.email || "Tu";

    return items.map((post) => ({
      post,
      authorName:
        user?.id && post.userId === user.id
          ? selfName
          : authorSummaries[post.userId]?.fullName ??
            authorSummaries[post.userId]?.username ??
            formatAuthorName(post.userId),
      authorSubtitle:
        authorSummaries[post.userId]?.city ??
        authorSummaries[post.userId]?.country ??
        undefined,
      avatarUrl: authorSummaries[post.userId]?.avatarUrl ?? undefined,
      currentUserId: user?.id,
      onLike: feedActions.likePost,
      onUnlike: feedActions.unlikePost,
      onProfileClick: () => router.push(`/profile/${post.userId}`),
    }));
  }, [
    feedActions.likePost,
    feedActions.unlikePost,
    items,
    profile?.fullName,
    user?.email,
    user?.id,
    authorSummaries,
    router,
  ]);

  useEffect(() => {
    if (status !== "authenticated" || items.length === 0) return;
    const uniqueIds = Array.from(new Set(items.map((post) => post.userId)));
    const missingIds = uniqueIds.filter(
      (id) => id && id !== user?.id && !authorSummaries[id]
    );
    if (missingIds.length === 0) return;
    let active = true;
    Promise.all(
      missingIds.map(async (id) => {
        try {
          const summary = await getUserSummary(id);
          return { id, summary };
        } catch {
          return null;
        }
      })
    ).then((results) => {
      if (!active) return;
      setAuthorSummaries((prev) => {
        const next = { ...prev };
        results.forEach((item) => {
          if (item?.summary) {
            next[item.id] = item.summary;
          }
        });
        return next;
      });
    });
    return () => {
      active = false;
    };
  }, [items, status, user?.id, authorSummaries]);

  const handleLoadMore = () => {
    if (loading || !hasMore) return;
    feedActions
      .fetchFeed(
        { ...feedFilters, page: page + 1, size: DEFAULT_PAGE_SIZE },
        { append: true }
      )
      .catch(() => undefined);
  };

  const handleOpenComposer = () => {
    setComposerError(null);
    setComposerNotice(null);
    setComposerOpen(true);
  };

  const handleCloseComposer = () => {
    if (composerLoading) return;
    setComposerOpen(false);
  };

  const handleComposerSubmit = async (payload: PostComposerPayload) => {
    setComposerError(null);
    setComposerNotice(null);
    setComposerLoading(true);

    try {
      const request: CreatePostRequest = {
        content: payload.content,
        language: language ?? undefined,
      };

      if (payload.includePosition && hasPosition && position) {
        request.latitude = position.latitude ?? null;
        request.longitude = position.longitude ?? null;
      }

      const created = await createPost(request);

      if (payload.files.length) {
        try {
          await Promise.all(
            payload.files.map((file) =>
              uploadPostMedia({ postId: created.id, file })
            )
          );
        } catch {
          setComposerNotice(
            "Post pubblicato, ma alcuni media non sono stati caricati."
          );
        }
      }

      setComposerOpen(false);
      feedActions
        .fetchFeed({ ...feedFilters, page: 0, size: DEFAULT_PAGE_SIZE })
        .catch(() => undefined);
    } catch (submitError) {
      setComposerError(
        resolveErrorMessage(submitError, "Errore durante la pubblicazione.")
      );
    } finally {
      setComposerLoading(false);
    }
  };

  const isInitialLoading = loading && items.length === 0;

  const storedFeed = (preferences?.feedPreferences ?? {}) as Record<
    string,
    JsonValue
  >;
  const onlyNearby = readBoolean(storedFeed.onlyNearby) ?? true;
  const radiusKm = readNumber(storedFeed.radiusKm);
  const positionLabel =
    hasPosition && position
      ? `${formatCoordinate(position.latitude)}, ${formatCoordinate(
          position.longitude
        )}`
      : undefined;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
              Feed
            </p>
            <h1 className="text-3xl font-semibold text-foreground">
              Post vicino a te
            </h1>
            <p className="text-sm text-muted">
              Scopri contenuti geolocalizzati e personalizzati.
            </p>
          </div>
          <Button size="sm" onClick={handleOpenComposer}>
            Crea post
          </Button>
        </div>
      </header>

      {composerNotice ? (
        <Card className="flex flex-wrap items-start justify-between gap-3 border-warning/30 bg-warning/15 p-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Media non caricati
            </p>
            <p className="text-xs text-muted">{composerNotice}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setComposerNotice(null)}
          >
            Chiudi
          </Button>
        </Card>
      ) : null}

      <Card className="flex flex-wrap items-center gap-3 p-4">
        <Badge tone="accent" size="sm">
          {onlyNearby ? "Solo vicini" : "Tutti i post"}
        </Badge>
        <Badge tone="neutral" size="sm">
          Raggio {radiusKm ? `${radiusKm} km` : "libero"}
        </Badge>
        <Badge tone={hasPosition ? "success" : "warning"} size="sm">
          {hasPosition ? "Posizione attiva" : "Posizione assente"}
        </Badge>
        {positionLoading ? (
          <span className="ml-auto inline-flex items-center gap-2 text-xs text-subtle">
            <Loader size="sm" />
            Aggiornamento posizione
          </span>
        ) : null}
      </Card>

      {isInitialLoading ? (
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">Caricamento feed...</p>
        </Card>
      ) : null}

      {error ? (
        <ErrorState
          title="Impossibile caricare il feed"
          description={error.message}
        />
      ) : null}

      {!isInitialLoading && !error && items.length === 0 ? (
        <EmptyState
          title="Nessun post disponibile"
          description="Torna piu tardi per vedere nuovi contenuti."
        />
      ) : null}

      {items.length ? <MapPostCard items={postItems} /> : null}

      {hasMore ? (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            size="md"
            onClick={handleLoadMore}
            loading={loading}
            loadingText="Caricamento"
          >
            Carica altri
          </Button>
        </div>
      ) : null}

      {composerOpen ? (
        <PostComposerModal
          open={composerOpen}
          loading={composerLoading}
          error={composerError}
          positionAvailable={hasPosition}
          positionLabel={positionLabel}
          onClose={handleCloseComposer}
          onSubmit={handleComposerSubmit}
        />
      ) : null}
    </div>
  );
};
