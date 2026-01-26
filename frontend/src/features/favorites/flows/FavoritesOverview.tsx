"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { useFavorites, usePosition } from "@/hooks";
import { calculateDistanceKm } from "@/lib/geo";
import { PlaceListItem } from "@/features/catalog/cards/PlaceListItem";
import type { PlaceListItemProps } from "@/features/catalog/cards/PlaceListItem";
import type { FavoriteResponse } from "@/types/favorites";

const PAGE_SIZE = 10;

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

  const currentType = "PLACE" as const;

  useEffect(() => {
    positionActions.hydrate();
  }, [positionActions]);

  useEffect(() => {
    const params = { type: currentType, size: PAGE_SIZE };
    actions.setFilters(params);
    actions.fetchFavorites(params).catch(() => undefined);
  }, [actions, currentType]);

  const visibleItems = useMemo(
    () => items.filter((favorite) => favorite.type === "PLACE"),
    [items]
  );

  const mappedFavorites = useMemo(
    () =>
      visibleItems.map((favorite) => {
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
    [canComputeDistance, position?.latitude, position?.longitude, visibleItems]
  );

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loading) return;
    actions
      .fetchFavorites(
        { type: currentType, page: pageInfo.page + 1, size: PAGE_SIZE },
        { append: true }
      )
      .catch(() => undefined);
  }, [actions, currentType, hasMore, loading, pageInfo.page]);

  const handleRemove = useCallback(
    async (favorite: FavoriteResponse) => {
      if (removingId === favorite.id) return;

      const params =
        favorite.type === "PLACE" ? { placeId: favorite.place?.id } : {};

      if (!params.placeId) return;

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
    actions
      .fetchFavorites({ type: currentType, size: PAGE_SIZE })
      .catch(() => undefined);
  }, [actions, currentType]);

  const isInitialLoading = loading && visibleItems.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
          Preferiti
        </p>
        <h1 className="text-3xl font-semibold text-foreground">I tuoi salvati</h1>
        <p className="text-sm text-muted">
          Ritrova rapidamente i luoghi che hai salvato.
        </p>
      </header>

      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] bg-surface-muted px-3 py-2 text-xs text-muted">
          <span className="font-semibold text-foreground">
            {visibleItems.length} elementi
          </span>
          {pageInfo.totalElements > 0 ? (
            <span className="text-subtle">
              (totale {pageInfo.totalElements})
            </span>
          ) : null}
          {canComputeDistance ? (
            <span className="rounded-full bg-card px-3 py-1 text-[11px] font-semibold text-subtle">
              Distanze basate sulla tua posizione salvata
            </span>
          ) : (
            <span className="rounded-full bg-card px-3 py-1 text-[11px] font-semibold text-subtle">
              Salva la posizione per calcolare le distanze
            </span>
          )}
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

      {!isInitialLoading && !error && visibleItems.length === 0 && (
        <EmptyState
          title="Nessun preferito ancora"
          description="Salva i luoghi che vuoi ritrovare rapidamente."
          actionLabel="Sfoglia luoghi"
          actionHref="/places"
        />
      )}

      {visibleItems.length > 0 && (
        <div className="space-y-4">
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
          {visibleItems.length} di {pageInfo.totalElements} elementi
        </p>
      )}
    </div>
  );
};
