"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/buttons/Button";
import { Badge } from "@/components/elements/Badge";
import { Card } from "@/components/elements/Card";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { useFavorites, usePosition } from "@/hooks";
import { calculateDistanceKm } from "@/lib/geo";
import { getPostMedia } from "@/services/media";
import type { MediaResponse } from "@/types/media";
import { ExperienceListItem } from "@/features/catalog/cards/ExperienceListItem";
import type { ExperienceListItemProps } from "@/features/catalog/cards/ExperienceListItem";
import { PlaceListItem } from "@/features/catalog/cards/PlaceListItem";
import type { PlaceListItemProps } from "@/features/catalog/cards/PlaceListItem";
import type { FavoriteResponse } from "@/types/favorites";

const PAGE_SIZE = 10;

const SCOPE_LABELS: Record<string, string> = {
  AMICIZIA: "Amicizia",
  ESPERIENZE: "Esperienze",
  LAVORO: "Lavoro",
  BENESSERE: "Benessere",
};

const TIMEFRAME_LABELS: Record<string, string> = {
  ORA: "Ora",
  OGGI: "Oggi",
};

const formatDate = (isoDate?: string | null) => {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
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
  return new Intl.NumberFormat("it-IT", {
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

  const scopeLabel = post?.scope ? SCOPE_LABELS[post.scope] ?? post.scope : null;
  const moodLabel = post?.mood ? post.mood.toLowerCase().replace(/_/g, " ") : null;
  const timeframeLabel = post?.timeframe
    ? TIMEFRAME_LABELS[post.timeframe] ?? post.timeframe
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
              alt="Media post"
              className="h-full w-full object-cover"
            />
          )
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-xs text-subtle">
            {mediaLoading ? <Loader size="sm" /> : null}
            <span>{mediaLoading ? "Caricamento media" : "Nessun media"}</span>
          </div>
        )}
        {media?.mediaType === "VIDEO" ? (
          <span className="absolute left-2 top-2 rounded-full bg-foreground/80 px-2 py-1 text-[10px] font-semibold text-white">
            Video
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Post salvato</p>
            {createdAt ? <p className="text-xs text-subtle">{createdAt}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={onOpen} disabled={!postId}>
              Apri
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemove(favorite)}
              loading={removing}
              loadingText="Rimuovo..."
            >
              Rimuovi
            </Button>
          </div>
        </div>
        <p className="text-sm text-foreground">
          {post?.content ?? "Contenuto non disponibile."}
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
          title: place?.name ?? "Luogo",
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
    [canComputeDistance, placeFavorites, position?.latitude, position?.longitude]
  );

  const mappedExperiences = useMemo(
    () =>
      experienceFavorites.map((favorite) => {
        const experience = favorite.experience;
        const cardProps: ExperienceListItemProps = {
          title: experience?.name ?? "Esperienza",
          subtitle:
            experience?.locationName ?? experience?.place?.name ?? undefined,
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
    [experienceFavorites]
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
          Preferiti
        </p>
        <h1 className="text-3xl font-semibold text-foreground">I tuoi salvati</h1>
        <p className="text-sm text-muted">
          Ritrova rapidamente luoghi ed elementi social che hai salvato.
        </p>
      </header>

      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] bg-surface-muted px-3 py-2 text-xs text-muted">
          <span className="font-semibold text-foreground">
            {items.length} elementi
          </span>
          {pageInfo.totalElements > 0 ? (
            <span className="text-subtle">
              (totale {pageInfo.totalElements})
            </span>
          ) : null}
          {placeFavorites.length > 0 ? (
            canComputeDistance ? (
              <span className="rounded-full bg-card px-3 py-1 text-[11px] font-semibold text-subtle">
                Distanze basate sulla tua posizione salvata
              </span>
            ) : (
              <span className="rounded-full bg-card px-3 py-1 text-[11px] font-semibold text-subtle">
                Salva la posizione per calcolare le distanze
              </span>
            )
          ) : null}
        </div>
      </Card>

      {isInitialLoading && (
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">Caricamento dei tuoi preferiti...</p>
        </Card>
      )}

      {error && !isInitialLoading && (
        <div className="space-y-3">
          <ErrorState
            title="Impossibile caricare i preferiti"
            description={error.message}
          />
          <Button variant="secondary" onClick={handleRetry} disabled={loading}>
            Riprova
          </Button>
        </div>
      )}

      {!isInitialLoading && !error && items.length === 0 && (
        <EmptyState
          title="Nessun preferito ancora"
          description="Salva luoghi e post che vuoi ritrovare rapidamente."
          actionLabel="Sfoglia luoghi"
          actionHref="/places"
        />
      )}

      {items.length > 0 && (
        <div className="space-y-6">
          {placeFavorites.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Luoghi</h2>
                <span className="text-xs text-subtle">
                  {placeFavorites.length} salvati
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
                        loadingText="Rimuovo..."
                      >
                        Rimuovi
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
                  Esperienze
                </h2>
                <span className="text-xs text-subtle">
                  {experienceFavorites.length} salvate
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
                        loadingText="Rimuovo..."
                      >
                        Rimuovi
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
                <h2 className="text-lg font-semibold text-foreground">Post</h2>
                <span className="text-xs text-subtle">
                  {postFavorites.length} salvati
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
                      router.push(`/insights?post=${postId}`);
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
                loadingText="Caricamento"
              >
                Carica altri
              </Button>
            </div>
          )}
        </div>
      )}

      {pageInfo.totalElements > 0 && (
        <p className="text-center text-xs text-subtle">
          {items.length} di {pageInfo.totalElements} elementi
        </p>
      )}
    </div>
  );
};
