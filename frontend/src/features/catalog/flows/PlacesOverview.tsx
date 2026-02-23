"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { Card } from "@/components/elements/Card";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { Button } from "@/components/buttons/Button";
import { SectionHeader } from "@/features/home/sections/SectionHeader";
import { MapPlaceListItem } from "@/features/catalog/lists/MapPlaceListItem";
import { ViatorExperiencesSection } from "@/features/catalog/sections/ViatorExperiencesSection";
import { useCatalog, usePosition, useT } from "@/hooks";
import { calculateDistanceKm } from "@/lib/geo";
import type { PlaceListItemProps } from "@/features/catalog/cards/PlaceListItem";

const PAGE_SIZE = 10;

export const PlacesOverview = () => {
  const { t } = useT();
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
        source: "GOOGLE",
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
          source: "GOOGLE",
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
        title={t("Places & Experiences")}
        subtitle={t("Places that make sense for you right now.")}
      />

      <section className="space-y-4">
        <SectionHeader title={t("Places")} />

        <div className="flex flex-wrap gap-2">
          <span
            className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-foreground shadow-sm"
          >
            {t("Provider")}: {t("Google Maps")}
          </span>
        </div>

        {isInitialLoading && (
          <Card className="flex items-center gap-3 p-5">
            <Loader size="sm" />
            <p className="text-sm text-muted">{t("Loading places...")}</p>
          </Card>
        )}

        {error && !isInitialLoading && (
          <ErrorState
            title={t("Unable to load places")}
            description={error.message}
          />
        )}

        {!isInitialLoading && !error && places.length === 0 && (
          <EmptyState
            title={t("No places found")}
            description={t("Come back later for new suggestions.")}
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
                  loadingText={t("Loading")}
                >
                  {t("Load more places")}
                </Button>
              </div>
            )}
          </>
        )}

        {placesPage.totalElements > 0 && (
          <p className="text-center text-xs text-subtle">
            {t("{current} of {total} places", {
              current: places.length,
              total: placesPage.totalElements,
            })}
          </p>
        )}
      </section>

      <ViatorExperiencesSection
        id="viator-experiences"
        title="Experiences"
        subtitle="Experiences powered by Viator, separated from local places."
        pageSize={8}
        showLoadMore
      />
    </div>
  );
};
