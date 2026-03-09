"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/elements/Card";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { Button } from "@/components/buttons/Button";
import { Input } from "@/components/elements/Input";
import { SectionHeader } from "@/features/home/sections/SectionHeader";
import { MapPlaceListItem } from "@/features/catalog/lists/MapPlaceListItem";
import { PlaceListItem } from "@/features/catalog/cards/PlaceListItem";
import { ExperienceListItem } from "@/features/catalog/cards/ExperienceListItem";
import { useCatalog, usePosition, useT } from "@/hooks";
import { calculateDistanceKm } from "@/lib/geo";
import { getExperienceDetailPath } from "@/lib/siteUrl";
import { cx } from "@/lib/classNames";
import { isViatorUnavailableError } from "@/lib/viatorErrors";
import type { PlaceListItemProps } from "@/features/catalog/cards/PlaceListItem";
import type { ExperienceListItemProps } from "@/features/catalog/cards/ExperienceListItem";
import type { ExperienceSummaryResponse } from "@/types/catalog";

const PAGE_SIZE = 10;

const formatDuration = (minutes: number | null): string | undefined => {
  if (!minutes) return undefined;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

const formatPrice = (price: number | null, currency: string | null): string | undefined => {
  if (price == null) return undefined;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency ?? "EUR",
  }).format(price);
};

type TabFilter = "all" | "places" | "experiences";

export const PlacesOverview = () => {
  const { t } = useT();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter");
  const initialFilter: TabFilter =
    filterParam === "places" || filterParam === "experiences" ? filterParam : "all";
  const [filter, setFilter] = useState<TabFilter>(initialFilter);

  useEffect(() => {
    if (filterParam === "places" || filterParam === "experiences") {
      setFilter(filterParam);
    }
  }, [filterParam]);
  const [citySearch, setCitySearch] = useState("");
  const [citySearchApplied, setCitySearchApplied] = useState("");
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [nearMe, setNearMe] = useState(false);
  const locationRequestedRef = useRef(false);
  const {
    places,
    placesPage,
    experiences,
    experiencesPage,
    catalogPlaces,
    catalogExperiences,
    catalogPlacesPage,
    catalogExperiencesPage,
    loading,
    loadingCatalog,
    loadingCatalogAppend,
    loadingAppend,
    error,
    hasMorePlaces,
    hasMoreExperiences,
    hasMoreCatalog,
    actions,
  } = useCatalog();
  const { position, hasPosition, permission: positionPermission, actions: positionActions } = usePosition();
  const [locationLoading, setLocationLoading] = useState(false);
  const showViatorUnavailable = isViatorUnavailableError(error);

  const hasLatLng = nearMe && hasPosition && position?.latitude != null && position?.longitude != null;
  // When "near me" is active (hasLatLng), never send text search — use only lat/lng so previous search (e.g. "Malta") is not sent
  const placeParams = useMemo(
    () => ({
      source: "GOOGLE" as const,
      size: PAGE_SIZE,
      q: hasLatLng ? undefined : (citySearchApplied || undefined),
      lat: hasLatLng ? position?.latitude ?? undefined : undefined,
      lng: hasLatLng ? position?.longitude ?? undefined : undefined,
      radiusKm: hasLatLng ? 100 : undefined,
    }),
    [citySearchApplied, hasLatLng, position?.latitude, position?.longitude]
  );

  const catalogParams = useMemo(
    () => ({
      size: PAGE_SIZE,
      q: hasLatLng ? undefined : (citySearchApplied || undefined),
      lat: hasLatLng ? position?.latitude ?? undefined : undefined,
      lng: hasLatLng ? position?.longitude ?? undefined : undefined,
      radiusKm: hasLatLng ? 100 : undefined,
    }),
    [citySearchApplied, hasLatLng, position?.latitude, position?.longitude]
  );

  const experienceParams = useMemo(
    () => ({
      source: "VIATOR" as const,
      size: PAGE_SIZE,
      q: hasLatLng ? undefined : (citySearchApplied || undefined),
      lat: hasLatLng ? position?.latitude ?? undefined : undefined,
      lng: hasLatLng ? position?.longitude ?? undefined : undefined,
      radiusKm: hasLatLng ? 100 : undefined,
    }),
    [citySearchApplied, hasLatLng, position?.latitude, position?.longitude]
  );

  // On section entry: request location once if permission unknown; default to "near me" when we have position.
  useEffect(() => {
    if (citySearchApplied) return;
    if (hasPosition && position?.latitude != null && position?.longitude != null) {
      setNearMe(true);
      return;
    }
    if (positionPermission !== "unknown" || locationRequestedRef.current) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    locationRequestedRef.current = true;
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
  }, [citySearchApplied, hasPosition, position?.latitude, position?.longitude, positionPermission, positionActions]);

  // Fetch by tab: only one of catalog, places, or experiences. Note: other components
  // (e.g. NearbyHighlight in the sidebar) also react to position and may call fetchPlaces
  // or fetchExperiences; they share the same global loading state.
  useEffect(() => {
    if (filter === "all") {
      actions.fetchCatalog(catalogParams).catch(() => undefined);
    } else if (filter === "places") {
      actions.fetchPlaces(placeParams).catch(() => undefined);
    } else if (filter === "experiences") {
      actions.fetchExperiences(experienceParams).catch(() => undefined);
    }
  }, [filter, citySearchApplied, hasLatLng, position?.latitude, position?.longitude, searchTrigger]);

  const clearFilters = useCallback(() => {
    setCitySearch("");
    setCitySearchApplied("");
    setNearMe(false);
  }, []);

  const clearCitySearchOnly = useCallback(() => {
    setCitySearch("");
    setCitySearchApplied("");
  }, []);

  const handleTabChange = useCallback(
    (newFilter: TabFilter) => {
      if (filter === newFilter) return;
      clearCitySearchOnly();
      setFilter(newFilter);
      const params = new URLSearchParams(searchParams.toString());
      if (newFilter === "all") params.delete("filter");
      else params.set("filter", newFilter);
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname);
    },
    [clearCitySearchOnly, filter, pathname, router, searchParams]
  );

  const handleSearchApply = useCallback(() => {
    const applied = citySearch.trim() || "";
    setCitySearchApplied(applied);
    if (applied) setNearMe(false);
    setSearchTrigger((t) => t + 1);
  }, [citySearch]);

  const handleNearMeClick = useCallback(() => {
    if (nearMe) {
      setNearMe(false);
      return;
    }
    if (hasPosition) {
      setCitySearch("");
      setCitySearchApplied("");
      if (filter === "experiences") actions.setLoading(true);
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
          setCitySearch("");
          setCitySearchApplied("");
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
  }, [filter, nearMe, hasPosition, positionActions, actions]);

  const handleLoadMore = useCallback(() => {
    if (!hasMorePlaces || loading) return;
    actions
      .fetchPlaces(
        { ...placeParams, page: placesPage.page + 1 },
        { append: true }
      )
      .catch(() => undefined);
  }, [actions, hasMorePlaces, loading, placeParams, placesPage.page]);

  const handleLoadMoreCatalog = useCallback(() => {
    if (!hasMoreCatalog || loadingCatalog) return;
    const nextPage = Math.max(catalogPlacesPage.page, catalogExperiencesPage.page) + 1;
    actions
      .fetchCatalog({ ...catalogParams, page: nextPage }, { append: true })
      .catch(() => undefined);
  }, [actions, catalogExperiencesPage.page, catalogParams, catalogPlacesPage.page, hasMoreCatalog, loadingCatalog]);

  const handleLoadMoreExperiences = useCallback(() => {
    if (!hasMoreExperiences || loading) return;
    actions
      .fetchExperiences(
        { ...experienceParams, page: experiencesPage.page + 1 },
        { append: true }
      )
      .catch(() => undefined);
  }, [actions, experienceParams, experiencesPage.page, hasMoreExperiences, loading]);

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

  const catalogPlaceItems: PlaceListItemProps[] = useMemo(
    () =>
      catalogPlaces.map((place) => {
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
    [catalogPlaces, hasPosition, position]
  );

  const catalogExperienceItems: ExperienceListItemProps[] = useMemo(
    () =>
      catalogExperiences.map((exp: ExperienceSummaryResponse) => ({
        title: exp.name,
        subtitle: exp.locationName ?? exp.place?.name ?? undefined,
        category: exp.category?.name ?? undefined,
        href: getExperienceDetailPath(exp),
        imageUrl: exp.imageUrl ?? undefined,
        priceLabel: formatPrice(exp.price, exp.priceCurrency),
        originalPriceLabel:
          exp.originalPrice && exp.price && exp.originalPrice > exp.price
            ? formatPrice(exp.originalPrice, exp.priceCurrency)
            : undefined,
        rating: exp.rating ?? undefined,
        reviewCount: exp.reviewCount ?? undefined,
        durationLabel: formatDuration(exp.durationMinutes),
        provider: exp.provider ?? undefined,
      })),
    [catalogExperiences]
  );

  /** Interleave places and experiences so they appear mixed in one grid. */
  const catalogMergedItems = useMemo(() => {
    const result: Array<
      { type: "PLACE"; props: PlaceListItemProps } | { type: "EXPERIENCE"; props: ExperienceListItemProps }
    > = [];
    const maxLen = Math.max(catalogPlaceItems.length, catalogExperienceItems.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < catalogPlaceItems.length) {
        result.push({ type: "PLACE", props: catalogPlaceItems[i] });
      }
      if (i < catalogExperienceItems.length) {
        result.push({ type: "EXPERIENCE", props: catalogExperienceItems[i] });
      }
    }
    return result;
  }, [catalogPlaceItems, catalogExperienceItems]);

  const experienceItems: ExperienceListItemProps[] = useMemo(
    () =>
      experiences.map((exp: ExperienceSummaryResponse) => ({
        title: exp.name,
        subtitle: exp.locationName ?? exp.place?.name ?? undefined,
        category: exp.category?.name ?? undefined,
        href: getExperienceDetailPath(exp),
        imageUrl: exp.imageUrl ?? undefined,
        priceLabel: formatPrice(exp.price, exp.priceCurrency),
        originalPriceLabel:
          exp.originalPrice && exp.price && exp.originalPrice > exp.price
            ? formatPrice(exp.originalPrice, exp.priceCurrency)
            : undefined,
        rating: exp.rating ?? undefined,
        reviewCount: exp.reviewCount ?? undefined,
        durationLabel: formatDuration(exp.durationMinutes),
        provider: exp.provider ?? undefined,
      })),
    [experiences]
  );

  const isInitialLoading = loading && places.length === 0;
  const isInitialLoadingCatalog = loadingCatalog && catalogPlaces.length === 0 && catalogExperiences.length === 0;
  const isInitialLoadingExperiences = loading && experiences.length === 0;

  /** Show overlay for initial/refresh load only; hide during "Load more" (append) so button shows loading instead */
  const showLoadingOverlay =
    (filter === "all" && loadingCatalog && !loadingCatalogAppend) ||
    (filter === "places" && loading && !loadingAppend) ||
    (filter === "experiences" && loading && !loadingAppend);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-12">
      <SectionHeader
        title={t("Places & Experiences")}
        subtitle={t("Places that make sense for you right now.")}
      />

      <Card className="flex flex-wrap items-center gap-2 border-border/70 bg-surface-muted/50 px-4 py-3 shadow-sm">
        <button
          type="button"
          onClick={() => handleTabChange("all")}
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
          onClick={() => handleTabChange("places")}
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
          onClick={() => handleTabChange("experiences")}
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
          <Button onClick={handleSearchApply} disabled={loading || loadingCatalog}>
            {t("Search")}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleNearMeClick}
            disabled={locationLoading || (nearMe && (loading || loadingCatalog))}
            className={cx(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              nearMe
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-surface text-foreground hover:bg-border",
              (locationLoading || (nearMe && (loading || loadingCatalog))) && "cursor-wait opacity-70"
            )}
          >
            {locationLoading
              ? t("Getting location…")
              : nearMe && (loading || loadingCatalog)
                ? t("Loading…")
                : t("Near me")}
          </button>
        </div>
      </Card>

      <div className="relative min-h-[320px]">
        {showLoadingOverlay && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-lg bg-background/80 backdrop-blur-sm"
            aria-busy="true"
            aria-live="polite"
          >
            <Loader size="lg" />
            <p className="text-sm font-medium text-muted">
              {filter === "all"
                ? t("Loading places and experiences...")
                : filter === "places"
                  ? t("Loading places...")
                  : t("Loading experiences...")}
            </p>
          </div>
        )}

        {filter === "all" && (
        <section className="space-y-6">
          {isInitialLoadingCatalog && (
            <Card className="flex min-h-[280px] flex-col items-center justify-center gap-4 p-8">
              <Loader size="lg" />
              <p className="text-sm font-medium text-muted">{t("Loading places and experiences...")}</p>
            </Card>
          )}
          {error && !isInitialLoadingCatalog && (
            showViatorUnavailable ? (
              <EmptyState
                title={t("Experiences temporarily unavailable")}
                description={t("Viator is temporarily unreachable. Please try again in a moment or switch to Places.")}
              />
            ) : (
              <ErrorState
                title={t("Unable to load catalog")}
                description={error.message}
              />
            )
          )}
          {!isInitialLoadingCatalog && !error && catalogPlaceItems.length === 0 && catalogExperienceItems.length === 0 && (
            <EmptyState
              title={t("No places or experiences found")}
              description={t("Try a different search or filter.")}
            />
          )}
          {catalogMergedItems.length > 0 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {catalogMergedItems.map((item, index) => (
                  <div key={item.type === "PLACE" ? `place-${item.props.href ?? index}` : `exp-${item.props.href ?? index}`} className="flex h-full min-h-0 flex-col">
                    {item.type === "PLACE" ? (
                      <PlaceListItem {...item.props} />
                    ) : (
                      <ExperienceListItem {...item.props} />
                    )}
                  </div>
                ))}
              </div>
              {hasMoreCatalog && (
                <div className="flex justify-center">
                  <Button
                    variant="secondary"
                    onClick={handleLoadMoreCatalog}
                    loading={loadingCatalog}
                    loadingText={t("Loading")}
                  >
                    {t("Load more")}
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {filter === "places" && (
        <section className="space-y-4">
          {isInitialLoading && (
            <Card className="flex min-h-[280px] flex-col items-center justify-center gap-4 p-8">
              <Loader size="lg" />
              <p className="text-sm font-medium text-muted">{t("Loading places...")}</p>
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
        <section className="space-y-4 relative">
          {isInitialLoadingExperiences && (
            <Card className="flex min-h-[280px] flex-col items-center justify-center gap-4 p-8">
              <Loader size="lg" />
              <p className="text-sm font-medium text-muted">{t("Loading experiences...")}</p>
            </Card>
          )}
          {!isInitialLoadingExperiences && error && (
            showViatorUnavailable ? (
              <EmptyState
                title={t("Experiences temporarily unavailable")}
                description={t("Viator is temporarily unreachable. Please try again in a moment.")}
              />
            ) : (
              <ErrorState
                title={t("Unable to load experiences")}
                description={error.message}
              />
            )
          )}
          {!isInitialLoadingExperiences && !error && experiences.length === 0 && (
            <EmptyState
              title={t("No experiences found")}
              description={t("Try a different search or filter.")}
            />
          )}
          {!isInitialLoadingExperiences && experiences.length > 0 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {experienceItems.map((item, index) => (
                  <div key={`exp-${item.href ?? index}`} className="flex h-full min-h-0 flex-col">
                    <ExperienceListItem {...item} />
                  </div>
                ))}
              </div>
              {hasMoreExperiences && (
                <div className="flex justify-center">
                  <Button
                    variant="secondary"
                    onClick={handleLoadMoreExperiences}
                    loading={loading}
                    loadingText={t("Loading")}
                  >
                    {t("Load more experiences")}
                  </Button>
                </div>
              )}
            </>
          )}
          {!isInitialLoadingExperiences && experiencesPage.totalElements > 0 && (
            <p className="text-center text-xs text-subtle">
              {t("{current} of {total} experiences", {
                current: experiences.length,
                total: experiencesPage.totalElements,
              })}
            </p>
          )}
        </section>
      )}
      </div>
    </div>
  );
};
