"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { Card } from "@/components/elements/Card";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { Button } from "@/components/buttons/Button";
import { SectionHeader } from "@/features/home/sections/SectionHeader";
import { MapPlaceListItem } from "@/features/catalog/lists/MapPlaceListItem";
import { AffiliationsRow } from "@/features/affiliations/sections/AffiliationsRow";
import { useCatalog, usePosition } from "@/hooks";
import { calculateDistanceKm } from "@/lib/geo";
import type { PlaceListItemProps } from "@/features/catalog/cards/PlaceListItem";

const PAGE_SIZE = 10;

export const PlacesOverview = () => {
  const {
    places,
    placesPage,
    loading,
    error,
    hasMorePlaces,
    actions,
  } = useCatalog();
  const { position, hasPosition } = usePosition();
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    actions
      .fetchPlaces({
        size: PAGE_SIZE,
        lat: hasPosition ? position?.latitude ?? undefined : undefined,
        lng: hasPosition ? position?.longitude ?? undefined : undefined,
      })
      .catch(() => undefined);
  }, [actions, hasPosition, position?.latitude, position?.longitude]);

  const handleLoadMore = useCallback(() => {
    if (!hasMorePlaces || loading) return;
    actions
      .fetchPlaces(
        {
          page: placesPage.page + 1,
          size: PAGE_SIZE,
          lat: hasPosition ? position?.latitude ?? undefined : undefined,
          lng: hasPosition ? position?.longitude ?? undefined : undefined,
        },
        { append: true }
      )
      .catch(() => undefined);
  }, [actions, hasMorePlaces, loading, placesPage.page, hasPosition, position?.latitude, position?.longitude]);

  const placeItems: PlaceListItemProps[] = useMemo(
    () =>
      places.map((place) => {
        let distanceKm: number | undefined;
        if (
          hasPosition &&
          position?.latitude != null &&
          position?.longitude != null &&
          place.latitude != null &&
          place.longitude != null
        ) {
          distanceKm = calculateDistanceKm(
            position.latitude,
            position.longitude,
            place.latitude,
            place.longitude
          );
        }
        return {
          title: place.name,
          subtitle: place.description ?? undefined,
          address: place.address ?? undefined,
          category: place.category?.name ?? undefined,
          metaItems: place.source ? [place.source] : [],
          href: `/places/${place.id}`,
          distanceKm,
          imageUrl: place.imageUrl ?? undefined,
          rating: place.googleRating ?? undefined,
          reviewCount: place.googleReviewCount ?? undefined,
        };
      }),
    [places, hasPosition, position]
  );

  const isInitialLoading = loading && places.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-12">
      <SectionHeader
        title="Places & Experiences"
        subtitle="Places that make sense for you right now."
        actionLabel="Explore More"
        actionHref="/places"
      />

      <div className="flex flex-wrap items-center gap-2 rounded-full border border-border/70 bg-surface px-3 py-2 text-xs text-muted">
        <span className="font-semibold text-foreground">Fine-Tune</span>
        <span>Nearby</span>
        <span className="text-subtle">Anywhere</span>
        <span>Distance</span>
        <span className="text-subtle">10 Km</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {["Experiences", "Events", "Stays", "Restaurants", "Places", "Services"].map((label) => (
          <span
            key={label}
            className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-foreground shadow-sm"
          >
            {label}
          </span>
        ))}
      </div>

      <AffiliationsRow
        id="affiliations"
        subtitle="Affiliate stays and experiences from our partners."
      />

      {isInitialLoading && (
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">Loading places...</p>
        </Card>
      )}

      {error && !isInitialLoading && (
        <ErrorState
          title="Unable to load places"
          description={error.message}
        />
      )}

      {!isInitialLoading && !error && places.length === 0 && (
        <EmptyState
          title="No places found"
          description="Come back later for new suggestions."
        />
      )}

      {places.length > 0 && (
        <>
          <MapPlaceListItem
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            items={placeItems}
          />
          {hasMorePlaces && (
            <div className="flex justify-center">
              <Button
                variant="secondary"
                onClick={handleLoadMore}
                loading={loading}
                loadingText="Loading"
              >
                Load more places
              </Button>
            </div>
          )}
        </>
      )}

      {placesPage.totalElements > 0 && (
        <p className="text-center text-xs text-subtle">
          {places.length} of {placesPage.totalElements} places
        </p>
      )}
    </div>
  );
};
