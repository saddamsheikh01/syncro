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

type TabFilter = "all" | "places" | "experiences";

export const PlacesOverview = () => {
  const { t } = useT();
  const [filter, setFilter] = useState<TabFilter>("all");
  const [citySearch, setCitySearch] = useState("");
  const [citySearchApplied, setCitySearchApplied] = useState("");
  const [nearMe, setNearMe] = useState(false);
  const {
    places,
    placesPage,
    loading,
    error,
    hasMorePlaces,
    actions,
  } = useCatalog();
  const { position, hasPosition, actions: positionActions } = usePosition();
  const bootstrappedRef = useRef(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const placeParams = useMemo(
    () => ({
      source: "GOOGLE" as const,
      size: PAGE_SIZE,
      q: citySearchApplied || undefined,
      lat: nearMe && hasPosition ? position?.latitude ?? undefined : undefined,
      lng: nearMe && hasPosition ? position?.longitude ?? undefined : undefined,
      radiusKm: nearMe && hasPosition ? 50 : undefined,
    }),
    [citySearchApplied, nearMe, hasPosition, position?.latitude, position?.longitude]
  );

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    if (filter === "places" || filter === "all") {
      actions
        .fetchPlaces({
          source: "GOOGLE",
          size: PAGE_SIZE,
          q: citySearchApplied || undefined,
          lat: nearMe && hasPosition ? position?.latitude ?? undefined : undefined,
          lng: nearMe && hasPosition ? position?.longitude ?? undefined : undefined,
          radiusKm: nearMe && hasPosition ? 50 : undefined,
        })
        .catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (filter === "places" || filter === "all") {
      actions.fetchPlaces(placeParams).catch(() => undefined);
    }
  }, [filter, citySearchApplied, nearMe, hasPosition, position?.latitude, position?.longitude]);

  const handleSearchApply = useCallback(() => {
    setCitySearchApplied(citySearch.trim() || "");
  }, [citySearch]);

  const handleNearMeClick = useCallback(() => {
    if (nearMe) {
      setNearMe(false);
      return;
    }
    if (hasPosition) {
      setNearMe(true);
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          positionActions.setPermission("granted");
          await positionActions.savePosition({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracyMeters: pos.coords.accuracy ?? undefined,
          });
          setNearMe(true);
        } catch {
          // keep nearMe false
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        positionActions.setPermission("denied");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [nearMe, hasPosition, positionActions]);

  const handleLoadMore = useCallback(() => {
    if (!hasMorePlaces || loading) return;
    actions
      .fetchPlaces(
        { ...placeParams, page: placesPage.page + 1 },
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
          metaItems: [],
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
          onClick={() => setFilter("all")}
          className={cx(
            "rounded-full border-2 px-4 py-2 text-sm font-semibold transition",
            filter === "all"
              ? "border-accent bg-accent text-accent-foreground"
              : "border-border bg-surface text-foreground hover:border-accent/50 hover:bg-surface"
          )}
        >
          {t("All")}
        </button>
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
          {t("Places")}
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
          {t("Experiences")}
        </button>
      </Card>

      <Card className="space-y-3 border-border/70 bg-surface-muted/30 p-4">
        <p className="text-xs font-semibold text-subtle">{t("Filters")}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div className="flex-1">
            <Input
              label={t("Search by city")}
              placeholder={t("City name...")}
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchApply()}
            />
          </div>
          <Button onClick={handleSearchApply} disabled={loading}>
            {t("Search")}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleNearMeClick}
            disabled={locationLoading}
            className={cx(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              nearMe
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-surface text-foreground hover:bg-border",
              locationLoading && "cursor-wait opacity-70"
            )}
          >
            {locationLoading ? t("Getting location…") : t("Near me")}
          </button>
        </div>
      </Card>

      {filter === "all" && (
        <section className="space-y-6">
          <MapPlaceListItem
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            items={placeItems}
          />
          <ViatorExperiencesSection
            id="viator-experiences"
            pageSize={PAGE_SIZE}
            showLoadMore
            hideSectionTitle
            embedFilters
            citySearch={citySearchApplied}
            nearMe={nearMe}
            hideProviderLabel
          />
        </section>
      )}

      {filter === "places" && (
        <section className="space-y-4">
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
          pageSize={PAGE_SIZE}
          showLoadMore
          hideSectionTitle
          embedFilters
          citySearch={citySearchApplied}
          nearMe={nearMe}
          hideProviderLabel
        />
      )}
    </div>
  );
};
