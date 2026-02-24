"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/elements/Card";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { Button } from "@/components/buttons/Button";
import { Input } from "@/components/elements/Input";
import { SectionHeader } from "@/features/home/sections/SectionHeader";
import { MapPlaceListItem } from "@/features/catalog/lists/MapPlaceListItem";
import { ViatorExperiencesSection } from "@/features/catalog/sections/ViatorExperiencesSection";
import { useCatalog, usePosition, useT } from "@/hooks";
import { calculateDistanceKm } from "@/lib/geo";
import { cx } from "@/lib/classNames";
import type { PlaceListItemProps } from "@/features/catalog/cards/PlaceListItem";

const PAGE_SIZE = 10;

type PlacesExperiencesFilter = "places" | "experiences";

const PLACE_RATING_OPTIONS: { value: number | null; labelKey: string }[] = [
  { value: null, labelKey: "Any rating" },
  { value: 3, labelKey: "3+ rating" },
  { value: 4, labelKey: "4+ rating" },
];

export const PlacesOverview = () => {
  const { t } = useT();
  const [filter, setFilter] = useState<PlacesExperiencesFilter>("places");
  const [placeSearch, setPlaceSearch] = useState("");
  const [placeSearchApplied, setPlaceSearchApplied] = useState("");
  const [placeMinRating, setPlaceMinRating] = useState<number | null>(null);
  const [placeOpenNow, setPlaceOpenNow] = useState(false);
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

  const placeParams = useMemo(
    () => ({
      source: "GOOGLE" as const,
      size: PAGE_SIZE,
      q: placeSearchApplied || undefined,
      minRating: placeMinRating ?? undefined,
      openNow: placeOpenNow ? true : undefined,
      lat: hasPosition ? position?.latitude ?? undefined : undefined,
      lng: hasPosition ? position?.longitude ?? undefined : undefined,
    }),
    [placeSearchApplied, placeMinRating, placeOpenNow, hasPosition, position?.latitude, position?.longitude]
  );

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

  const handlePlacesFilterApply = useCallback(() => {
    const q = placeSearch.trim() || undefined;
    setPlaceSearchApplied(q || "");
    actions.fetchPlaces({ ...placeParams, q, page: 0 }).catch(() => undefined);
  }, [actions, placeParams, placeSearch]);

  const handlePlaceMinRatingChange = useCallback(
    (value: number | null) => {
      setPlaceMinRating(value);
      actions.fetchPlaces({ ...placeParams, minRating: value ?? undefined, page: 0 }).catch(() => undefined);
    },
    [actions, placeParams]
  );

  const handlePlaceOpenNowChange = useCallback(
    (open: boolean) => {
      setPlaceOpenNow(open);
      actions
        .fetchPlaces({
          ...placeParams,
          openNow: open ? true : undefined,
          page: 0,
        })
        .catch(() => undefined);
    },
    [actions, placeParams]
  );

  const handleLoadMore = useCallback(() => {
    if (!hasMorePlaces || loading) return;
    actions
      .fetchPlaces(
        {
          ...placeParams,
          page: placesPage.page + 1,
        },
        { append: true }
      )
      .catch(() => undefined);
  }, [actions, hasMorePlaces, loading, placeParams, placesPage.page]);

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

      <Card className="flex flex-wrap items-center gap-2 border-border/70 bg-surface-muted/50 px-4 py-3 shadow-sm">
        <button
          type="button"
          onClick={() => setFilter("places")}
          className={cx(
            "rounded-full border-2 px-4 py-2 text-sm font-semibold transition",
            filter === "places"
              ? "border-accent bg-accent text-accent-foreground"
              : "border-border bg-surface text-foreground hover:border-accent/50 hover:bg-surface"
          )}
        >
          {t("Places")} ({t("Google Maps")})
        </button>
        <button
          type="button"
          onClick={() => setFilter("experiences")}
          className={cx(
            "rounded-full border-2 px-4 py-2 text-sm font-semibold transition",
            filter === "experiences"
              ? "border-accent bg-accent text-accent-foreground"
              : "border-border bg-surface text-foreground hover:border-accent/50 hover:bg-surface"
          )}
        >
          {t("Experiences")} ({t("Viator")})
        </button>
      </Card>

      {filter === "places" && (
      <section className="space-y-4">
        <SectionHeader title={t("Places")} />

        <div className="flex flex-wrap gap-2">
          <span
            className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-foreground shadow-sm"
          >
            {t("Provider")}: {t("Google Maps")}
          </span>
        </div>

        <Card className="space-y-3 border-border/70 bg-surface-muted/30 p-4">
          <p className="text-xs font-semibold text-subtle">{t("Filters")}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
            <div className="flex-1">
              <Input
                label={t("Search places")}
                placeholder={t("Name or address...")}
                value={placeSearch}
                onChange={(e) => setPlaceSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePlacesFilterApply()}
              />
            </div>
            <Button onClick={handlePlacesFilterApply} disabled={loading}>
              {t("Search")}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-subtle">{t("Min. rating")}:</span>
            {PLACE_RATING_OPTIONS.map(({ value, labelKey }) => (
              <button
                key={value ?? "any"}
                type="button"
                onClick={() => handlePlaceMinRatingChange(value)}
                className={cx(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition",
                  placeMinRating === value
                    ? "bg-accent text-accent-foreground"
                    : "bg-surface-muted text-foreground hover:bg-border"
                )}
              >
                {t(labelKey)}
              </button>
            ))}
            <label className="ml-2 flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={placeOpenNow}
                onChange={(e) => handlePlaceOpenNowChange(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-accent"
              />
              <span className="text-xs font-medium text-foreground">{t("Open now")}</span>
            </label>
          </div>
        </Card>

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
      )}

      {filter === "experiences" && (
        <ViatorExperiencesSection
          id="viator-experiences"
          title={t("Experiences")}
          subtitle={t("Experiences powered by Viator.")}
          pageSize={8}
          showLoadMore
        />
      )}
    </div>
  );
};
