"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/elements/Card";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { Button } from "@/components/buttons/Button";
import { MapPermissionScreen } from "@/features/map/sections/MapPermissionScreen";
import { MapFilterPanel } from "@/features/map/sections/MapFilterPanel";
import { MapPlacePreview } from "@/features/map/sections/MapPlacePreview";
import { MapLegend } from "@/features/map/sections/MapLegend";
import type { LegendItemData } from "@/features/map/lists/MapLegendItem";
import type { SelectOption } from "@/components/elements/Select";
import type { PlaceResult } from "@/components/elements/PlacesAutocomplete";
import type { FilterChipItem } from "@/features/map/lists/MapFilterChip";
import type { PlaceSummaryResponse } from "@/types/catalog";
import type { RecommendationResponse } from "@/types/matches";
import { useAnalytics, useCatalog, useMatches, usePosition, useT } from "@/hooks";
import { calculateDistanceKm } from "@/lib/geo";

// Import dinamico per GoogleMapContainer (evita SSR issues)
const GoogleMapContainer = dynamic(
  () =>
    import("@/features/map/components/GoogleMapContainer").then(
      (mod) => mod.GoogleMapContainer
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-[var(--radius-lg)] bg-surface-muted">
        <Loader size="md" />
      </div>
    ),
  }
);

const PAGE_SIZE = 50;

const DISTANCE_OPTIONS: SelectOption[] = [
  { label: "10 km", value: "10" },
  { label: "25 km", value: "25" },
  { label: "50 km", value: "50" },
  { label: "100 km", value: "100" },
];

const LEGEND_ITEMS: LegendItemData[] = [
  { id: "place", label: "Place", swatch: "var(--accent)" },
  { id: "user", label: "Your location", swatch: "var(--success)" },
];

export const MapOverview = () => {
  const { t } = useT();
  const {
    places,
    categories,
    loading,
    error,
    actions: catalogActions,
  } = useCatalog();
  const {
    position,
    permission,
    hasPosition,
    loading: positionLoading,
    actions: positionActions,
  } = usePosition();
  const {
    recommendations,
    loadingRecommendations,
    error: matchesError,
    actions: matchesActions,
  } = useMatches();
  const { actions: analyticsActions } = useAnalytics();

  const [selectedPlace, setSelectedPlace] =
    useState<PlaceSummaryResponse | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<RecommendationResponse | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDistance, setSelectedDistance] = useState<string>("100");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchLocation, setSearchLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [forYouMode, setForYouMode] = useState(false);
  const [gpsWatchId, setGpsWatchId] = useState<number | null>(null);
  const [isRequestingPosition, setIsRequestingPosition] = useState(false);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const bootstrappedRef = useRef(false);
  const forYouFetchedRef = useRef(false);
  const analyticsTrackedRef = useRef(false);

  // Traccia evento MAP_OPENED quando la mappa è visibile
  useEffect(() => {
    if (permission !== "granted") return;
    if (analyticsTrackedRef.current) return;
    analyticsTrackedRef.current = true;
    analyticsActions.trackEvent({ eventType: "MAP_OPENED" }).catch(() => undefined);
  }, [permission, analyticsActions]);

  // Carica categorie all'avvio
  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    catalogActions.fetchCategories({ size: 50 }).catch(() => undefined);
  }, [catalogActions]);

  // Carica raccomandazioni quando forYouMode è attivo
  useEffect(() => {
    if (!forYouMode || permission !== "granted") return;
    if (forYouFetchedRef.current) return;
    forYouFetchedRef.current = true;
    matchesActions.fetchRecommendations({ type: "PLACE", size: 50 }).catch(() => undefined);
  }, [forYouMode, permission, matchesActions]);

  // Reset flag quando si disattiva forYouMode
  useEffect(() => {
    if (!forYouMode) {
      forYouFetchedRef.current = false;
    }
  }, [forYouMode]);

  // Carica luoghi quando cambia posizione o filtri
  useEffect(() => {
    if (permission !== "granted") return;
    if (forYouMode) return; // In modalità "Per te" usa le raccomandazioni

    const params: Record<string, unknown> = {
      size: PAGE_SIZE,
      source: "GOOGLE",
      categoryId: selectedCategory || undefined,
      q: searchQuery || undefined,
    };

    const currentPosition = position;
    const hasSearchLocation =
      searchLocation?.latitude !== undefined &&
      searchLocation?.longitude !== undefined;
    const canUseUserPosition =
      hasPosition &&
      currentPosition?.latitude !== null &&
      currentPosition?.longitude !== null;

    // Applica filtro distanza solo quando abbiamo coordinate (evita errore radiusKm senza lat/lng)
    const shouldUseRadius = hasSearchLocation || !searchQuery;
    if (hasSearchLocation) {
      params.lat = searchLocation?.latitude;
      params.lng = searchLocation?.longitude;
    } else if (canUseUserPosition && currentPosition) {
      params.lat = currentPosition.latitude;
      params.lng = currentPosition.longitude;
    }
    if (shouldUseRadius && params.lat != null && params.lng != null) {
      params.radiusKm = selectedDistance ? Number(selectedDistance) : undefined;
    }

    catalogActions.fetchPlaces(params).catch(() => undefined);
  }, [
    catalogActions,
    permission,
    hasPosition,
    position?.latitude,
    position?.longitude,
    selectedCategory,
    selectedDistance,
    searchQuery,
    searchLocation,
    forYouMode,
  ]);

  // Gestione ricerca con debounce
  const handleSearchChange = useCallback((value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setSearchLocation(null);
      setSearchQuery(value);
    }, 400);
  }, []);

  const handlePlaceSearchSelect = useCallback((place: PlaceResult) => {
    setSearchLocation({ latitude: place.latitude, longitude: place.longitude });
    setSearchQuery("");
    setSelectedPlace(null);
    setSelectedRecommendation(null);
    void analyticsActions.trackEvent({
      eventName: "MAP_SEARCH_LOCATION_SELECTED",
      payload: {
        latitude: place.latitude,
        longitude: place.longitude,
        name: place.name,
        address: place.address,
      },
    });
  }, [analyticsActions]);

  const handleAutocompleteClear = useCallback(() => {
    setSearchLocation(null);
    setSearchQuery("");
  }, []);

  // Richiedi permessi posizione
  const handleRequestPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by the browser");
      positionActions.setPermission("denied");
      return;
    }

    setIsRequestingPosition(true);

    // Verifica lo stato dei permessi se disponibile
    if (navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: "geolocation" });
        console.log("Geolocation permissions state:", result.state);
        if (result.state === "denied") {
          setIsRequestingPosition(false);
          positionActions.setPermission("denied");
          return;
        }
      } catch (e) {
        console.log("Permissions API not supported:", e);
      }
    }

    console.log("Requesting location...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log("Location obtained:", pos.coords.latitude, pos.coords.longitude);
        setIsRequestingPosition(false);
        positionActions.setPermission("granted");
        positionActions.setPosition({
          userId: "",
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracyMeters: pos.coords.accuracy,
          updatedAt: new Date().toISOString(),
        });

        // Avvia tracking continuo
        const watchId = navigator.geolocation.watchPosition(
          (watchPos) => {
            positionActions.setPosition({
              userId: "",
              latitude: watchPos.coords.latitude,
              longitude: watchPos.coords.longitude,
              accuracyMeters: watchPos.coords.accuracy,
              updatedAt: new Date().toISOString(),
            });
          },
          (err) => {
            console.warn("Watch position error:", err.message);
          },
          { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
        );
        setGpsWatchId(watchId);
      },
      (err) => {
        console.error("Geolocation error:", err.code, err.message);
        setIsRequestingPosition(false);
        positionActions.setPermission("denied");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [positionActions]);

  // Continua senza posizione
  const handleSkipPermission = useCallback(() => {
    positionActions.setPermission("granted");
    catalogActions.fetchPlaces({ size: PAGE_SIZE }).catch(() => undefined);
  }, [positionActions, catalogActions]);

  // Cleanup watch position
  useEffect(() => {
    return () => {
      if (gpsWatchId !== null) {
        navigator.geolocation.clearWatch(gpsWatchId);
      }
    };
  }, [gpsWatchId]);

  // Gestione selezione luogo
  const handlePlaceSelect = useCallback((place: PlaceSummaryResponse) => {
    setSelectedPlace(place);
    void analyticsActions.trackEvent({
      eventName: "MAP_PLACE_SELECTED",
      payload: {
        placeId: place.id,
        categoryId: place.category?.id ?? null,
        categoryName: place.category?.name ?? null,
      },
    });
  }, [analyticsActions]);

  const handleClosePreview = useCallback(() => {
    setSelectedPlace(null);
  }, []);

  // Apri Google Maps
  const handleOpenDirections = useCallback(() => {
    if (!selectedPlace?.latitude || !selectedPlace?.longitude) return;
    void analyticsActions.trackEvent({
      eventName: "MAP_DIRECTIONS_OPENED",
      payload: { placeId: selectedPlace.id },
    });
    const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.latitude},${selectedPlace.longitude}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [analyticsActions, selectedPlace]);

  // Categorie come opzioni select
  const categoryOptions: SelectOption[] = useMemo(
    () => categories.map((cat) => ({ label: cat.name, value: cat.id })),
    [categories]
  );

  // Filtri come chip
  const filterChips: FilterChipItem[] = useMemo(() => {
    const chips: FilterChipItem[] = [];
    if (hasPosition) {
      chips.push({ id: "nearby", label: t("Near me"), selected: !forYouMode });
    }
    chips.push({ id: "forYou", label: t("For you"), selected: forYouMode });
    return chips;
  }, [hasPosition, forYouMode, t]);

  // Gestione toggle filtri chip
  const handleFilterToggle = useCallback((id: string, nextSelected: boolean) => {
    void analyticsActions.trackEvent({
      eventName: "MAP_FILTER_TOGGLED",
      payload: { filterId: id, selected: nextSelected },
    });
    if (id === "forYou") {
      setForYouMode(nextSelected);
      if (nextSelected) {
        setSelectedPlace(null);
        setSelectedRecommendation(null);
      }
    }
  }, [analyticsActions]);

  // Calcola distanza per il luogo selezionato
  const selectedPlaceDistance = useMemo(() => {
    const currentPosition = position;
    if (
      !selectedPlace ||
      !hasPosition ||
      !currentPosition ||
      currentPosition.latitude === null ||
      currentPosition.longitude === null ||
      selectedPlace.latitude === null ||
      selectedPlace.longitude === null
    ) {
      return undefined;
    }
    return calculateDistanceKm(
      currentPosition.latitude,
      currentPosition.longitude,
      selectedPlace.latitude,
      selectedPlace.longitude
    );
  }, [selectedPlace, hasPosition, position]);

  // Posizione utente per la mappa
  const userPositionForMap = useMemo(() => {
    const currentPosition = position;
    if (
      !hasPosition ||
      !currentPosition ||
      currentPosition.latitude === null ||
      currentPosition.longitude === null
    ) {
      return null;
    }
    return {
      latitude: currentPosition.latitude,
      longitude: currentPosition.longitude,
    };
  }, [hasPosition, position]);

  // Luoghi da mostrare sulla mappa (normali o raccomandati)
  const displayPlaces: PlaceSummaryResponse[] = useMemo(() => {
    if (forYouMode) {
      return recommendations
        .filter((r) => r.type === "PLACE" && r.place !== null)
        .map((r) => r.place!);
    }
    return places;
  }, [forYouMode, recommendations, places]);

  // Mappa delle raccomandazioni per ID (per recuperare lo score)
  const recommendationsByPlaceId = useMemo(() => {
    const map = new Map<string, RecommendationResponse>();
    if (forYouMode) {
      recommendations.forEach((r) => {
        if (r.place) {
          map.set(r.place.id, r);
        }
      });
    }
    return map;
  }, [forYouMode, recommendations]);

  // Score del luogo selezionato (solo in modalità "Per te")
  const selectedPlaceScore = useMemo(() => {
    if (!forYouMode || !selectedPlace) return null;
    const rec = recommendationsByPlaceId.get(selectedPlace.id);
    return rec?.score ?? null;
  }, [forYouMode, selectedPlace, recommendationsByPlaceId]);

  // Gate permessi
  if (permission === "unknown") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
            {t("Explore")}
          </p>
          <h1 className="text-3xl font-semibold text-foreground">{t("Map")}</h1>
          <p className="text-sm text-muted">
            {t("Discover interesting places around you.")}
          </p>
        </header>
        {isRequestingPosition ? (
          <Card className="flex items-center gap-4 p-6">
            <Loader size="sm" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">
                {t("Searching for location...")}
              </p>
              <p className="text-sm text-muted">
                {t("Accept the permission in the browser prompt.")}
              </p>
            </div>
          </Card>
        ) : (
          <MapPermissionScreen
            title={t("Enable location")}
            description={t(
              "To show nearby places, we need access to your location."
            )}
            primaryActionLabel={t("Enable location")}
            secondaryActionLabel={t("Continue without location")}
            helper={t("You can change this choice anytime in settings.")}
            onPrimaryAction={handleRequestPermission}
            onSecondaryAction={handleSkipPermission}
          />
        )}
      </div>
    );
  }

  // Gate permessi negati
  if (permission === "denied") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
            {t("Explore")}
          </p>
          <h1 className="text-3xl font-semibold text-foreground">{t("Map")}</h1>
        </header>
        <Card className="space-y-4 p-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {t("Location unavailable")}
            </h3>
            <p className="text-sm text-muted">
              {t(
                "You denied location access. To see nearby places, enable location in your browser settings."
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="sm" onClick={handleSkipPermission}>
              {t("Continue without location")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => positionActions.setPermission("unknown")}
            >
              {t("Try again")}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const isInitialLoading = forYouMode
    ? loadingRecommendations && displayPlaces.length === 0
    : loading && places.length === 0 && !positionLoading;
  const currentError = forYouMode ? matchesError : error;
  const legendItems = LEGEND_ITEMS.map((item) => ({
    ...item,
    label: t(item.label),
  }));

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="shrink-0 space-y-2 px-6 pb-4 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
              {t("Explore")}
            </p>
            <h1 className="text-2xl font-semibold text-foreground">{t("Map")}</h1>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? t("Hide filters") : t("Filters")}
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="relative flex min-h-0 flex-1 gap-4 px-6 pb-6">
        {/* Filtri (sidebar su desktop, overlay su mobile) */}
        {showFilters && (
          <aside className="absolute left-6 top-0 z-20 w-80 lg:relative lg:left-0 lg:shrink-0">
            <MapFilterPanel
              categoryOptions={categoryOptions}
              distanceOptions={DISTANCE_OPTIONS}
              defaultCategory={selectedCategory ?? undefined}
              defaultDistance={selectedDistance}
              filters={filterChips}
              onFilterToggle={handleFilterToggle}
              onCategoryChange={(val) => setSelectedCategory(val || null)}
              onDistanceChange={(val) => setSelectedDistance(val || "25")}
              onSearchChange={handleSearchChange}
              onPlaceSelect={handlePlaceSearchSelect}
              onAutocompleteClear={handleAutocompleteClear}
              userPosition={userPositionForMap}
              showAction={false}
            />
          </aside>
        )}

        {/* Mappa */}
        <div className="relative min-h-[400px] flex-1 overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface-muted">
          {isInitialLoading && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-surface/80">
              <div className="flex items-center gap-3">
                <Loader size="sm" />
                <p className="text-sm text-muted">{t("Loading places...")}</p>
              </div>
            </div>
          )}

          {currentError && !isInitialLoading && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6">
              <ErrorState
                title={
                  forYouMode
                    ? t("Unable to load suggestions")
                    : t("Unable to load places")
                }
                description={currentError.message}
              />
            </div>
          )}

          {!currentError && displayPlaces.length === 0 && !isInitialLoading && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6">
              <EmptyState
                title={
                  forYouMode
                    ? t("No suggestions available")
                    : t("No places found")
                }
                description={
                  forYouMode
                    ? t(
                        "Complete your profile and tests to receive personalized suggestions."
                      )
                    : t("Try adjusting the filters or expanding the search radius.")
                }
              />
            </div>
          )}

          <GoogleMapContainer
            places={displayPlaces}
            userPosition={userPositionForMap}
            selectedPlaceId={selectedPlace?.id}
            onPlaceSelect={handlePlaceSelect}
            recenterTrigger={recenterTrigger}
          />

          {/* Legenda */}
          <div className="absolute bottom-4 left-4 z-10">
            <MapLegend items={legendItems} title="" />
          </div>

          {/* Pulsante torna alla mia posizione */}
          {hasPosition && (
            <div className="absolute bottom-4 right-4 z-10">
              <button
                type="button"
                onClick={() => setRecenterTrigger((prev) => prev + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface shadow-md transition hover:bg-surface-muted"
                aria-label={t("Recenter to my location")}
                title={t("Recenter to my location")}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-accent"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                </svg>
              </button>
            </div>
          )}

          {/* Info luoghi caricati */}
          {displayPlaces.length > 0 && (
            <div className="absolute right-4 top-4 z-10">
              <Card className="px-3 py-2">
                <p className="text-xs font-medium text-muted">
                  {forYouMode
                    ? t("{count} recommended", { count: displayPlaces.length })
                    : t("{count} places", { count: displayPlaces.length })}
                </p>
              </Card>
            </div>
          )}
        </div>

        {/* Preview luogo selezionato */}
        {selectedPlace && (
          <aside className="absolute bottom-6 left-6 right-6 z-20 lg:relative lg:bottom-0 lg:left-0 lg:right-0 lg:w-80 lg:shrink-0">
            <MapPlacePreview
              title={selectedPlace.name}
              subtitle={selectedPlace.description ?? undefined}
              category={selectedPlace.category?.name}
              distanceKm={selectedPlaceDistance}
              ratingLabel={
                selectedPlaceScore !== null
                  ? t("{score}% Match", { score: Math.round(selectedPlaceScore) })
                  : undefined
              }
              googleRating={selectedPlace.googleRating ?? undefined}
              googleReviewCount={selectedPlace.googleReviewCount ?? undefined}
              imageUrl={selectedPlace.imageUrl ?? undefined}
              primaryActionLabel={t("Details")}
              secondaryActionLabel={t("Directions")}
              onPrimaryAction={() => {
                window.location.href = `/places/${selectedPlace.id}`;
              }}
              onSecondaryAction={handleOpenDirections}
              onClose={handleClosePreview}
            />
          </aside>
        )}
      </div>
    </div>
  );
};
