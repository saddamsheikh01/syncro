"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/elements/Card";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { Button } from "@/components/buttons/Button";
import { Input } from "@/components/elements/Input";
import { Select } from "@/components/elements/Select";
import type { SelectOption } from "@/components/elements/Select";
import { Switch } from "@/components/elements/Switch";
import { MapPlaceListItem } from "@/features/catalog/lists/MapPlaceListItem";
import { useCatalog, usePosition } from "@/hooks";
import { calculateDistanceKm } from "@/lib/geo";
import type { PlaceListItemProps } from "@/features/catalog/cards/PlaceListItem";
import type { CatalogSource } from "@/services/catalog";

const PAGE_SIZE = 10;
const GOOGLE_TYPE_OPTIONS: SelectOption[] = [
  { value: "all", label: "Tutti i tipi" },
  { value: "restaurant", label: "Ristoranti" },
  { value: "cafe", label: "Caffetterie" },
  { value: "bar", label: "Bar & cocktail" },
  { value: "bakery", label: "Pasticcerie" },
  { value: "museum", label: "Musei" },
  { value: "art_gallery", label: "Gallerie d'arte" },
  { value: "park", label: "Parchi" },
  { value: "tourist_attraction", label: "Attrazioni" },
  { value: "shopping_mall", label: "Shopping" },
  { value: "spa", label: "Spa & benessere" },
  { value: "gym", label: "Palestre" },
];
const RATING_OPTIONS: SelectOption[] = [
  { value: "all", label: "Qualsiasi rating" },
  { value: "4.5", label: "4.5+ eccellente" },
  { value: "4.0", label: "4.0+ ottimo" },
  { value: "3.5", label: "3.5+ buono" },
  { value: "3.0", label: "3.0+ discreto" },
];

type PlaceFilterOverrides = {
  search?: string;
  categoryId?: string | null;
  googleType?: string;
  openNowOnly?: boolean;
  minRating?: string;
  page?: number;
};

export const PlacesOverview = () => {
  const {
    places,
    placesPage,
    categories,
    loading,
    error,
    hasMorePlaces,
    actions,
  } = useCatalog();
  const { position, hasPosition } = usePosition();
  const bootstrappedRef = useRef(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [googleType, setGoogleType] = useState("all");
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [minRating, setMinRating] = useState("all");

  const buildParams = useCallback(
    (overrides: PlaceFilterOverrides = {}) => {
      const nextSearch = overrides.search ?? search;
      const nextCategory = overrides.categoryId ?? selectedCategory;
      const nextGoogleType = overrides.googleType ?? googleType;
      const nextOpenNow = overrides.openNowOnly ?? openNowOnly;
      const nextMinRating = overrides.minRating ?? minRating;
      const hasGoogleType = nextGoogleType !== "all";
      const hasMinRating = nextMinRating !== "all";
      const googleFiltersActive = hasGoogleType || nextOpenNow || hasMinRating;

      const source: CatalogSource | undefined = googleFiltersActive ? "GOOGLE" : undefined;

      return {
        q: nextSearch || undefined,
        categoryId: nextCategory || undefined,
        googleTypes: hasGoogleType ? [nextGoogleType] : undefined,
        openNow: nextOpenNow ? true : undefined,
        minRating: hasMinRating ? Number(nextMinRating) : undefined,
        source,
        lat: hasPosition ? position?.latitude ?? undefined : undefined,
        lng: hasPosition ? position?.longitude ?? undefined : undefined,
        page: overrides.page,
        size: PAGE_SIZE,
      };
    },
    [googleType, minRating, openNowOnly, position, search, selectedCategory, hasPosition]
  );

  const fetchPlaces = useCallback(
    (
      overrides: PlaceFilterOverrides = {},
      options: { append?: boolean } = {}
    ) => {
      actions.fetchPlaces(buildParams(overrides), options).catch(() => undefined);
    },
    [actions, buildParams]
  );

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    actions.fetchCategories({ size: 50 }).catch(() => undefined);
    fetchPlaces();
  }, [actions, fetchPlaces]);

  const handleSearch = useCallback(() => {
    fetchPlaces({ search });
  }, [fetchPlaces, search]);

  const handleCategoryChange = useCallback(
    (categoryId: string | null) => {
      setSelectedCategory(categoryId);
      fetchPlaces({ categoryId, search });
    },
    [fetchPlaces, search]
  );

  const handleLoadMore = useCallback(() => {
    if (!hasMorePlaces || loading) return;
    fetchPlaces(
      {
        search,
        categoryId: selectedCategory,
        page: placesPage.page + 1,
      },
      { append: true }
    );
  }, [fetchPlaces, hasMorePlaces, loading, search, selectedCategory, placesPage.page]);

  const handleGoogleTypeChange = useCallback(
    (value: string) => {
      setGoogleType(value);
      fetchPlaces({ googleType: value, search });
    },
    [fetchPlaces, search]
  );

  const handleRatingChange = useCallback(
    (value: string) => {
      setMinRating(value);
      fetchPlaces({ minRating: value, search });
    },
    [fetchPlaces, search]
  );

  const handleOpenNowChange = useCallback(
    (checked: boolean) => {
      setOpenNowOnly(checked);
      fetchPlaces({ openNowOnly: checked, search });
    },
    [fetchPlaces, search]
  );

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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
          Catalogo
        </p>
        <h1 className="text-3xl font-semibold text-foreground">Luoghi</h1>
        <p className="text-sm text-muted">
          Esplora luoghi selezionati per te.
        </p>
      </header>

      <Card className="space-y-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Cerca"
              placeholder="Nome o descrizione..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            Cerca
          </Button>
        </div>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleCategoryChange(null)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                selectedCategory === null
                  ? "bg-accent text-accent-contrast"
                  : "bg-surface-muted text-muted hover:bg-border"
              }`}
            >
              Tutti
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  selectedCategory === cat.id
                    ? "bg-accent text-accent-contrast"
                    : "bg-surface-muted text-muted hover:bg-border"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
        <div className="grid gap-3 md:grid-cols-3">
          <Select
            label="Tipo (Google)"
            options={GOOGLE_TYPE_OPTIONS}
            value={googleType}
            onValueChange={handleGoogleTypeChange}
          />
          <Select
            label="Rating minimo"
            options={RATING_OPTIONS}
            value={minRating}
            onValueChange={handleRatingChange}
          />
          <Switch
            label="Aperti ora"
            description="Mostra solo luoghi aperti."
            checked={openNowOnly}
            onChange={(event) => handleOpenNowChange(event.target.checked)}
          />
        </div>
        <p className="text-xs text-subtle">
          I filtri Google usano i dati sincronizzati da Google Maps.
        </p>
      </Card>

      {isInitialLoading && (
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">Caricamento luoghi...</p>
        </Card>
      )}

      {error && !isInitialLoading && (
        <ErrorState
          title="Impossibile caricare i luoghi"
          description={error.message}
        />
      )}

      {!isInitialLoading && !error && places.length === 0 && (
        <EmptyState
          title="Nessun luogo trovato"
          description="Prova a modificare i filtri di ricerca."
        />
      )}

      {places.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {placeItems.map((item, index) => (
              <MapPlaceListItem key={index} items={[item]} />
            ))}
          </div>
          {hasMorePlaces && (
            <div className="flex justify-center">
              <Button
                variant="secondary"
                onClick={handleLoadMore}
                loading={loading}
                loadingText="Caricamento"
              >
                Carica altri luoghi
              </Button>
            </div>
          )}
        </>
      )}

      {placesPage.totalElements > 0 && (
        <p className="text-center text-xs text-subtle">
          {places.length} di {placesPage.totalElements} luoghi
        </p>
      )}
    </div>
  );
};
