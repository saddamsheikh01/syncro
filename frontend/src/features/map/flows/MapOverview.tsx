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
import type { FilterChipItem } from "@/features/map/lists/MapFilterChip";
import type { PlaceSummaryResponse } from "@/types/catalog";
import type { RecommendationResponse } from "@/types/matches";
import { useCatalog, usePosition, useMatches } from "@/hooks";
import { calculateDistanceKm } from "@/lib/geo";

// Import dinamico per MapContainer (evita SSR issues con Leaflet)
const MapContainer = dynamic(
  () =>
    import("@/features/map/components/MapContainer").then(
      (mod) => mod.MapContainer
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
  { label: "1 km", value: "1" },
  { label: "5 km", value: "5" },
  { label: "10 km", value: "10" },
  { label: "25 km", value: "25" },
  { label: "50 km", value: "50" },
];

const LEGEND_ITEMS: LegendItemData[] = [
  { id: "place", label: "Luogo", swatch: "var(--accent)" },
  { id: "user", label: "La tua posizione", swatch: "var(--success)" },
];

export const MapOverview = () => {
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

  const [selectedPlace, setSelectedPlace] =
    useState<PlaceSummaryResponse | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<RecommendationResponse | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDistance, setSelectedDistance] = useState<string>("25");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [forYouMode, setForYouMode] = useState(false);
  const [gpsWatchId, setGpsWatchId] = useState<number | null>(null);
  const [isRequestingPosition, setIsRequestingPosition] = useState(false);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const bootstrappedRef = useRef(false);
  const forYouFetchedRef = useRef(false);

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
      categoryId: selectedCategory || undefined,
      q: searchQuery || undefined,
    };

    // Applica filtro distanza solo se NON c'è una ricerca testuale
    // Questo permette di cercare luoghi in altre città
    if (!searchQuery) {
      params.radiusKm = selectedDistance ? Number(selectedDistance) : undefined;
      if (hasPosition && position?.latitude && position?.longitude) {
        params.lat = position.latitude;
        params.lng = position.longitude;
      }
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
    forYouMode,
  ]);

  // Gestione ricerca con debounce
  const handleSearchChange = useCallback((value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 400);
  }, []);

  // Richiedi permessi posizione
  const handleRequestPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      console.error("Geolocation non supportata dal browser");
      positionActions.setPermission("denied");
      return;
    }

    setIsRequestingPosition(true);

    // Verifica lo stato dei permessi se disponibile
    if (navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: "geolocation" });
        console.log("Stato permessi geolocation:", result.state);
        if (result.state === "denied") {
          setIsRequestingPosition(false);
          positionActions.setPermission("denied");
          return;
        }
      } catch (e) {
        console.log("Permissions API non supportata:", e);
      }
    }

    console.log("Richiesta posizione in corso...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log("Posizione ottenuta:", pos.coords.latitude, pos.coords.longitude);
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
  }, []);

  const handleClosePreview = useCallback(() => {
    setSelectedPlace(null);
  }, []);

  // Apri Google Maps
  const handleOpenDirections = useCallback(() => {
    if (!selectedPlace?.latitude || !selectedPlace?.longitude) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.latitude},${selectedPlace.longitude}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [selectedPlace]);

  // Categorie come opzioni select
  const categoryOptions: SelectOption[] = useMemo(
    () => categories.map((cat) => ({ label: cat.name, value: cat.id })),
    [categories]
  );

  // Filtri come chip
  const filterChips: FilterChipItem[] = useMemo(() => {
    const chips: FilterChipItem[] = [];
    if (hasPosition) {
      chips.push({ id: "nearby", label: "Vicino a me", selected: !forYouMode });
    }
    chips.push({ id: "forYou", label: "Per te", selected: forYouMode });
    return chips;
  }, [hasPosition, forYouMode]);

  // Gestione toggle filtri chip
  const handleFilterToggle = useCallback((id: string, nextSelected: boolean) => {
    if (id === "forYou") {
      setForYouMode(nextSelected);
      if (nextSelected) {
        setSelectedPlace(null);
        setSelectedRecommendation(null);
      }
    }
  }, []);

  // Calcola distanza per il luogo selezionato
  const selectedPlaceDistance = useMemo(() => {
    if (
      !selectedPlace ||
      !hasPosition ||
      !position?.latitude ||
      !position?.longitude ||
      !selectedPlace.latitude ||
      !selectedPlace.longitude
    ) {
      return undefined;
    }
    return calculateDistanceKm(
      position.latitude,
      position.longitude,
      selectedPlace.latitude,
      selectedPlace.longitude
    );
  }, [selectedPlace, hasPosition, position]);

  // Posizione utente per la mappa
  const userPositionForMap = useMemo(() => {
    if (!hasPosition || !position?.latitude || !position?.longitude) {
      return null;
    }
    return { latitude: position.latitude, longitude: position.longitude };
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
            Esplora
          </p>
          <h1 className="text-3xl font-semibold text-foreground">Mappa</h1>
          <p className="text-sm text-muted">
            Scopri luoghi interessanti intorno a te.
          </p>
        </header>
        {isRequestingPosition ? (
          <Card className="flex items-center gap-4 p-6">
            <Loader size="sm" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">
                Ricerca posizione in corso...
              </p>
              <p className="text-sm text-muted">
                Accetta il permesso nel popup del browser.
              </p>
            </div>
          </Card>
        ) : (
          <MapPermissionScreen
            title="Attiva la posizione"
            description="Per mostrarti i luoghi più vicini, abbiamo bisogno di accedere alla tua posizione."
            primaryActionLabel="Attiva posizione"
            secondaryActionLabel="Continua senza posizione"
            helper="Puoi modificare questa scelta in qualsiasi momento dalle impostazioni."
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
            Esplora
          </p>
          <h1 className="text-3xl font-semibold text-foreground">Mappa</h1>
        </header>
        <Card className="space-y-4 p-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Posizione non disponibile
            </h3>
            <p className="text-sm text-muted">
              Hai negato l&apos;accesso alla posizione. Per vedere i luoghi
              vicini, abilita la posizione dalle impostazioni del browser.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="sm" onClick={handleSkipPermission}>
              Continua senza posizione
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => positionActions.setPermission("unknown")}
            >
              Riprova
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

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="shrink-0 space-y-2 px-6 pb-4 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
              Esplora
            </p>
            <h1 className="text-2xl font-semibold text-foreground">Mappa</h1>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? "Nascondi filtri" : "Filtri"}
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
                <p className="text-sm text-muted">Caricamento luoghi...</p>
              </div>
            </div>
          )}

          {currentError && !isInitialLoading && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6">
              <ErrorState
                title={forYouMode ? "Impossibile caricare i suggerimenti" : "Impossibile caricare i luoghi"}
                description={currentError.message}
              />
            </div>
          )}

          {!currentError && displayPlaces.length === 0 && !isInitialLoading && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6">
              <EmptyState
                title={forYouMode ? "Nessun suggerimento disponibile" : "Nessun luogo trovato"}
                description={forYouMode
                  ? "Completa il tuo profilo e i test per ricevere suggerimenti personalizzati."
                  : "Prova a modificare i filtri o ad ampliare il raggio di ricerca."
                }
              />
            </div>
          )}

          <MapContainer
            places={displayPlaces}
            userPosition={userPositionForMap}
            selectedPlaceId={selectedPlace?.id}
            onPlaceSelect={handlePlaceSelect}
            recenterTrigger={recenterTrigger}
          />

          {/* Legenda */}
          <div className="absolute bottom-4 left-4 z-10">
            <MapLegend items={LEGEND_ITEMS} title="" />
          </div>

          {/* Pulsante torna alla mia posizione */}
          {hasPosition && (
            <div className="absolute bottom-4 right-4 z-10">
              <button
                type="button"
                onClick={() => setRecenterTrigger((t) => t + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface shadow-md transition hover:bg-surface-muted"
                aria-label="Torna alla mia posizione"
                title="Torna alla mia posizione"
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
                  {displayPlaces.length} {forYouMode ? "suggeriti" : "luoghi"}
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
              ratingLabel={selectedPlaceScore !== null ? `${Math.round(selectedPlaceScore)}% compatibile` : undefined}
              primaryActionLabel="Dettagli"
              secondaryActionLabel="Indicazioni"
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
