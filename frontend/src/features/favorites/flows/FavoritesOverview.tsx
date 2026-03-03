"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/buttons/Button";
import { Badge } from "@/components/elements/Badge";
import { Card } from "@/components/elements/Card";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { useFavorites, usePosition, useT } from "@/hooks";
import { calculateDistanceKm } from "@/lib/geo";
import { getPostMedia } from "@/services/media";
import type { MediaResponse } from "@/types/media";
import { ExperienceListItem } from "@/features/catalog/cards/ExperienceListItem";
import type { ExperienceListItemProps } from "@/features/catalog/cards/ExperienceListItem";
import { PlaceListItem } from "@/features/catalog/cards/PlaceListItem";
import type { PlaceListItemProps } from "@/features/catalog/cards/PlaceListItem";
import type { FavoriteResponse } from "@/types/favorites";
import { getRuntimeBcp47 } from "@/i18n/runtimeLocale";

const PAGE_SIZE = 10;

const SCOPE_LABEL_KEYS: Record<string, string> = {
  AMICIZIA: "Friendship",
  ESPERIENZE: "Experiences",
  LAVORO: "Work",
  BENESSERE: "Wellness",
};

const TIMEFRAME_LABEL_KEYS: Record<string, string> = {
  ORA: "Now",
  OGGI: "Today",
};

const formatDate = (isoDate?: string | null) => {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(getRuntimeBcp47(), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDuration = (minutes: number | null): string | undefined => {
  if (!minutes) return undefined;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

const formatPrice = (
  price: number | null,
  currency: string | null
): string | undefined => {
  if (price == null) return undefined;
  const curr = currency ?? "EUR";
  return new Intl.NumberFormat(getRuntimeBcp47(), {
    style: "currency",
    currency: curr,
  }).format(price);
};

type FavoritePostCardProps = {
  favorite: FavoriteResponse;
  removing: boolean;
  onOpen: () => void;
  onRemove: (favorite: FavoriteResponse) => void;
};

const FavoritePostCard = ({
  favorite,
  removing,
  onOpen,
  onRemove,
}: FavoritePostCardProps) => {
  const { t } = useT();
  const post = favorite.post;
  const postId = post?.id;
  const [media, setMedia] = useState<MediaResponse | null>(null);
  const [mediaLoading, setMediaLoading] = useState(Boolean(postId));

  useEffect(() => {
    if (!postId) return;
    let active = true;
    getPostMedia({ postId, page: 0, size: 1 })
      .then((response) => {
        if (!active) return;
        setMedia(response.content?.[0] ?? null);
      })
      .catch(() => {
        if (!active) return;
        setMedia(null);
      })
      .finally(() => {
        if (!active) return;
        setMediaLoading(false);
      });

    return () => {
      active = false;
    };
  }, [postId]);

  const scopeLabel = post?.scope
    ? t(SCOPE_LABEL_KEYS[post.scope] ?? post.scope)
    : null;
  const moodLabel = post?.mood
    ? t(
        post.mood
          .toLowerCase()
          .replace(/_/g, " ")
          .replace(/^\w/, (char) => char.toUpperCase())
      )
    : null;
  const timeframeLabel = post?.timeframe
    ? t(TIMEFRAME_LABEL_KEYS[post.timeframe] ?? post.timeframe)
    : null;
  const createdAt = formatDate(post?.createdAt ?? null);

  return (
    <Card className="flex flex-col gap-4 p-5 sm:flex-row">
      <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface-muted sm:w-44">
        {media ? (
          media.mediaType === "VIDEO" ? (
            <video
              className="h-full w-full object-cover"
              src={media.url}
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <img
              src={media.url}
              alt={t("Post media")}
              className="h-full w-full object-cover"
            />
          )
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-xs text-subtle">
            {mediaLoading ? <Loader size="sm" /> : null}
            <span>{mediaLoading ? t("Loading media") : t("No media")}</span>
          </div>
        )}
        {media?.mediaType === "VIDEO" ? (
          <span className="absolute left-2 top-2 rounded-full bg-foreground/80 px-2 py-1 text-[10px] font-semibold text-white">
            {t("Video")}
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {t("Saved post")}
            </p>
            {createdAt ? <p className="text-xs text-subtle">{createdAt}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={onOpen} disabled={!postId}>
              {t("Open")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemove(favorite)}
              loading={removing}
              loadingText={t("Removing...")}
            >
              {t("Remove")}
            </Button>
          </div>
        </div>
        <p className="text-sm text-foreground">
          {post?.content ?? t("Content not available.")}
        </p>
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
      </div>
    </Card>
  );
};

const resolveDistance = (
  favorite: FavoriteResponse,
  canComputeDistance: boolean,
  userLat: number | null,
  userLng: number | null
) => {
  if (!canComputeDistance || userLat === null || userLng === null) return undefined;

  const placeLat = favorite.place?.latitude;
  const placeLng = favorite.place?.longitude;
  if (
    favorite.type === "PLACE" &&
    typeof placeLat === "number" &&
    typeof placeLng === "number"
  ) {
    return calculateDistanceKm(
      userLat,
      userLng,
      placeLat,
      placeLng
    );
  }

  return undefined;
};

export const FavoritesOverview = () => {
  const router = useRouter();
  const { t } = useT();
  const { items, pageInfo, loading, error, hasMore, actions } = useFavorites();
  const {
    position,
    hasPosition,
    actions: positionActions,
  } = usePosition();

  const [removingId, setRemovingId] = useState<string | null>(null);

  const canComputeDistance =
    hasPosition &&
    position?.latitude !== null &&
    position?.longitude !== null;

  useEffect(() => {
    positionActions.hydrate();
  }, [positionActions]);

  useEffect(() => {
    const params = { size: PAGE_SIZE };
    actions.setFilters(params);
    actions.fetchFavorites(params).catch(() => undefined);
  }, [actions]);

  const placeFavorites = useMemo(
    () => items.filter((favorite) => favorite.type === "PLACE"),
    [items]
  );

  const experienceFavorites = useMemo(
    () => items.filter((favorite) => favorite.type === "EXPERIENCE"),
    [items]
  );

  const postFavorites = useMemo(
    () => items.filter((favorite) => favorite.type === "POST"),
    [items]
  );

  const mappedFavorites = useMemo(
    () =>
      placeFavorites.map((favorite) => {
        const distanceKm = resolveDistance(
          favorite,
          canComputeDistance,
          position?.latitude ?? null,
          position?.longitude ?? null
        );

        const place = favorite.place;
        const cardProps: PlaceListItemProps = {
          title: place?.name ?? t("Place"),
          subtitle: place?.description ?? undefined,
          address: place?.address ?? undefined,
          category: place?.category?.name ?? undefined,
          metaItems: place?.source ? [place.source] : [],
          distanceKm,
          imageUrl: place?.imageUrl ?? undefined,
          rating: place?.googleRating ?? undefined,
          reviewCount: place?.googleReviewCount ?? undefined,
          href: place ? `/places/${place.id}` : undefined,
        };
        return { favorite, cardProps };
      }),
    [
      canComputeDistance,
      placeFavorites,
      position?.latitude,
      position?.longitude,
      t,
    ]
  );

  const mappedExperiences = useMemo(
    () =>
      experienceFavorites.map((favorite) => {
        const experience = favorite.experience;
        const cardProps: ExperienceListItemProps = {
          title: experience?.name ?? t("Experience"),
          subtitle:
            experience?.place?.name ?? experience?.locationName ?? undefined,
          category: experience?.category?.name ?? undefined,
          href: experience ? `/experiences/${experience.id}` : undefined,
          imageUrl: experience?.imageUrl ?? undefined,
          priceLabel: formatPrice(experience?.price ?? null, experience?.priceCurrency ?? null),
          originalPriceLabel:
            experience?.originalPrice &&
            experience?.price &&
            experience.originalPrice > experience.price
              ? formatPrice(
                  experience.originalPrice,
                  experience.priceCurrency ?? null
                )
              : undefined,
          rating: experience?.rating ?? undefined,
          reviewCount: experience?.reviewCount ?? undefined,
          durationLabel: formatDuration(experience?.durationMinutes ?? null),
          provider: experience?.provider ?? undefined,
        };
        return { favorite, cardProps };
      }),
    [experienceFavorites, t]
  );

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loading) return;
    actions
      .fetchFavorites(
        { page: pageInfo.page + 1, size: PAGE_SIZE },
        { append: true }
      )
      .catch(() => undefined);
  }, [actions, hasMore, loading, pageInfo.page]);

  const handleRemove = useCallback(
    async (favorite: FavoriteResponse) => {
      if (removingId === favorite.id) return;

      const params =
        favorite.type === "PLACE"
          ? { placeId: favorite.place?.id }
          : favorite.type === "EXPERIENCE"
            ? { experienceId: favorite.experience?.id }
          : favorite.type === "POST"
            ? { postId: favorite.post?.id }
            : {};

      if (!params.placeId && !params.experienceId && !params.postId) return;

      setRemovingId(favorite.id);
      try {
        await actions.removeFavorite(params);
      } catch {
        // Gestito dallo store
      } finally {
        setRemovingId(null);
      }
    },
    [actions, removingId]
  );

  const handleRetry = useCallback(() => {
    actions.fetchFavorites({ size: PAGE_SIZE }).catch(() => undefined);
  }, [actions]);

  const isInitialLoading = loading && items.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
          {t("Favorites")}
        </p>
        <h1 className="text-3xl font-semibold text-foreground">
          {t("Your saved items")}
        </h1>
        <p className="text-sm text-muted">
          {t("Quickly find places and social items you've saved.")}
        </p>
      </header>

      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] bg-surface-muted px-3 py-2 text-xs text-muted">
          <span className="font-semibold text-foreground">
            {t("{count} items", { count: items.length })}
          </span>
          {pageInfo.totalElements > 0 ? (
            <span className="text-subtle">
              {t("(total {count})", { count: pageInfo.totalElements })}
            </span>
          ) : null}
          {placeFavorites.length > 0 ? (
            canComputeDistance ? (
              <span className="rounded-full bg-card px-3 py-1 text-[11px] font-semibold text-subtle">
                {t("Distances based on your saved location")}
              </span>
            ) : (
              <span className="rounded-full bg-card px-3 py-1 text-[11px] font-semibold text-subtle">
                {t("Save your location to calculate distances")}
              </span>
            )
          ) : null}
        </div>
      </Card>

      {isInitialLoading && (
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">{t("Loading your favorites...")}</p>
        </Card>
      )}

      {error && !isInitialLoading && (
        <div className="space-y-3">
          <ErrorState
            title={t("Unable to load favorites")}
            description={error.message}
          />
          <Button variant="secondary" onClick={handleRetry} disabled={loading}>
            {t("Retry")}
          </Button>
        </div>
      )}

      {!isInitialLoading && !error && items.length === 0 && (
        <EmptyState
          title={t("No favorites yet")}
          description={t("Save places and posts you want to quickly find.")}
          actionLabel={t("Browse places")}
          actionHref="/places"
        />
      )}

      {items.length > 0 && (
        <div className="space-y-6">
          {placeFavorites.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  {t("Places")}
                </h2>
                <span className="text-xs text-subtle">
                  {t("{count} saved", { count: placeFavorites.length })}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {mappedFavorites.map(({ favorite, cardProps }, index) => (
                  <div key={`${favorite.id}-${index}`} className="relative">
                    <PlaceListItem {...cardProps} className="h-full" />
                    <div className="absolute right-4 top-4 z-10">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemove(favorite)}
                        loading={removingId === favorite.id}
                        loadingText={t("Removing...")}
                      >
                        {t("Remove")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {experienceFavorites.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  {t("Experiences")}
                </h2>
                <span className="text-xs text-subtle">
                  {t("{count} saved", { count: experienceFavorites.length })}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {mappedExperiences.map(({ favorite, cardProps }, index) => (
                  <div key={`${favorite.id}-${index}`} className="relative">
                    <ExperienceListItem {...cardProps} className="h-full" />
                    <div className="absolute right-4 top-4 z-10">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemove(favorite)}
                        loading={removingId === favorite.id}
                        loadingText={t("Removing...")}
                      >
                        {t("Remove")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {postFavorites.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  {t("Posts")}
                </h2>
                <span className="text-xs text-subtle">
                  {t("{count} saved", { count: postFavorites.length })}
                </span>
              </div>
              <div className="space-y-4">
                {postFavorites.map((favorite) => (
                  <FavoritePostCard
                    key={favorite.id}
                    favorite={favorite}
                    removing={removingId === favorite.id}
                    onOpen={() => {
                      const postId = favorite.post?.id;
                      if (!postId) return;
                      router.push(`/moments?post=${postId}`);
                    }}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="secondary"
                onClick={handleLoadMore}
                loading={loading}
                loadingText={t("Loading")}
              >
                {t("Load more")}
              </Button>
            </div>
          )}
        </div>
      )}

      {pageInfo.totalElements > 0 && (
        <p className="text-center text-xs text-subtle">
          {t("{current} of {total} items", {
            current: items.length,
            total: pageInfo.totalElements,
          })}
        </p>
      )}
    </div>
  );
};
