"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/elements/Card";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { Button } from "@/components/buttons/Button";
import { Badge } from "@/components/elements/Badge";
import { Tag } from "@/components/elements/Tag";
import { AffiliationLinkBox } from "@/features/catalog/sections/AffiliationLinkBox";
import { useCatalog, useFavorites, usePosition } from "@/hooks";
import { isUuid } from "@/lib/validators";
import { calculateDistanceKm, formatDistanceKm } from "@/lib/geo";

export interface PlaceDetailProps {
  placeId: string;
}

export const PlaceDetail = ({ placeId }: PlaceDetailProps) => {
  const router = useRouter();
  const { placeDetail, loading, error, actions } = useCatalog();
  const { items: favorites, actions: favoritesActions } = useFavorites();
  const { position, hasPosition } = usePosition();
  const bootstrappedRef = useRef(false);
  const favoritesBootstrappedRef = useRef(false);
  const isValidId = isUuid(placeId);
  const [savingFavorite, setSavingFavorite] = useState(false);

  const distanceKm = useMemo(() => {
    if (
      !hasPosition ||
      !position?.latitude ||
      !position?.longitude ||
      !placeDetail?.latitude ||
      !placeDetail?.longitude
    ) {
      return null;
    }
    return calculateDistanceKm(
      position.latitude,
      position.longitude,
      placeDetail.latitude,
      placeDetail.longitude
    );
  }, [hasPosition, position, placeDetail]);

  const isFavorite = useMemo(
    () => favorites.some((fav) => fav.place?.id === placeId),
    [favorites, placeId]
  );

  const handleToggleFavorite = useCallback(async () => {
    if (savingFavorite) return;
    setSavingFavorite(true);
    try {
      if (isFavorite) {
        await favoritesActions.removeFavorite({ placeId });
      } else {
        await favoritesActions.addFavorite({ placeId });
      }
    } catch {
      // Error handled by store
    } finally {
      setSavingFavorite(false);
    }
  }, [placeId, isFavorite, savingFavorite, favoritesActions]);

  useEffect(() => {
    if (!isValidId) {
      actions.clearDetails();
      return;
    }
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    actions.fetchPlace(placeId).catch(() => undefined);
    return () => actions.clearDetails();
  }, [actions, placeId, isValidId]);

  useEffect(() => {
    if (favoritesBootstrappedRef.current) return;
    favoritesBootstrappedRef.current = true;
    favoritesActions.fetchFavorites({ type: "PLACE" }).catch(() => undefined);
  }, [favoritesActions]);

  if (!isValidId) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <ErrorState
          title="Luogo non valido"
          description="Il luogo richiesto non esiste o non e disponibile."
          actionLabel="Torna ai luoghi"
          actionHref="/places"
        />
      </div>
    );
  }

  const isInitialLoading = loading && !placeDetail;

  if (isInitialLoading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">Caricamento luogo...</p>
        </Card>
      </div>
    );
  }

  if (error && !placeDetail) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <ErrorState
          title="Impossibile caricare il luogo"
          description={error.message}
          actionLabel="Torna ai luoghi"
          actionHref="/places"
        />
      </div>
    );
  }

  if (!placeDetail) {
    return null;
  }

  const affiliationLink = placeDetail.affiliationLinks?.[0];
  const hasCoordinates = placeDetail.latitude && placeDetail.longitude;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <button
        type="button"
        onClick={() => router.back()}
        className="self-start text-sm text-muted hover:text-foreground"
      >
        &larr; Indietro
      </button>

      <Card className="space-y-4 p-5">
        <div className="overflow-hidden rounded-[var(--radius-lg)] bg-surface-muted">
          <div className="h-48 w-full" />
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-foreground">
                {placeDetail.name}
              </h1>
            </div>
            {placeDetail.category && (
              <Badge tone="accent">{placeDetail.category.name}</Badge>
            )}
          </div>
        </div>

        {placeDetail.description && (
          <p className="text-sm text-muted">{placeDetail.description}</p>
        )}

        {placeDetail.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {placeDetail.tags.map((tag) => (
              <Tag key={tag.id} tone="neutral">
                {tag.name}
              </Tag>
            ))}
          </div>
        )}

        {affiliationLink && (
          <AffiliationLinkBox
            title="Prenota questo luogo"
            href={affiliationLink.url}
            provider={affiliationLink.provider ?? undefined}
          />
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          {hasCoordinates && (
            <Button
              onClick={() =>
                window.open(
                  `https://www.google.com/maps?q=${placeDetail.latitude},${placeDetail.longitude}`,
                  "_blank"
                )
              }
            >
              Apri in Google Maps
            </Button>
          )}
          <Button
            variant={isFavorite ? "outline" : "secondary"}
            onClick={handleToggleFavorite}
            loading={savingFavorite}
            loadingText={isFavorite ? "Rimuovo..." : "Salvo..."}
          >
            {isFavorite ? "Rimuovi dai preferiti" : "Salva nei preferiti"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: placeDetail.name,
                  url: window.location.href,
                });
              }
            }}
          >
            Condividi
          </Button>
        </div>
      </Card>

      {hasCoordinates && (
        <Card className="space-y-3 p-5">
          <h3 className="text-base font-semibold text-foreground">Posizione</h3>
          {distanceKm !== null && (
            <p className="text-sm font-medium text-accent">
              A {formatDistanceKm(distanceKm)} da te
            </p>
          )}
          <p className="text-sm text-muted">
            Coordinate: {placeDetail.latitude?.toFixed(6)},{" "}
            {placeDetail.longitude?.toFixed(6)}
          </p>
        </Card>
      )}
    </div>
  );
};
