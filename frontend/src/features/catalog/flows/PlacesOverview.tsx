"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/elements/Card";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { Button } from "@/components/buttons/Button";
import { Input } from "@/components/elements/Input";
import { MapPlaceListItem } from "@/features/catalog/lists/MapPlaceListItem";
import { useCatalog } from "@/hooks";
import type { PlaceListItemProps } from "@/features/catalog/cards/PlaceListItem";

const PAGE_SIZE = 10;

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
  const bootstrappedRef = useRef(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    actions.fetchCategories({ size: 50 }).catch(() => undefined);
    actions.fetchPlaces({ size: PAGE_SIZE }).catch(() => undefined);
  }, [actions]);

  const handleSearch = useCallback(() => {
    actions
      .fetchPlaces({
        q: search || undefined,
        categoryId: selectedCategory || undefined,
        size: PAGE_SIZE,
      })
      .catch(() => undefined);
  }, [actions, search, selectedCategory]);

  const handleCategoryChange = useCallback(
    (categoryId: string | null) => {
      setSelectedCategory(categoryId);
      actions
        .fetchPlaces({
          q: search || undefined,
          categoryId: categoryId || undefined,
          size: PAGE_SIZE,
        })
        .catch(() => undefined);
    },
    [actions, search]
  );

  const handleLoadMore = useCallback(() => {
    if (!hasMorePlaces || loading) return;
    actions
      .fetchPlaces(
        {
          q: search || undefined,
          categoryId: selectedCategory || undefined,
          page: placesPage.page + 1,
          size: PAGE_SIZE,
        },
        { append: true }
      )
      .catch(() => undefined);
  }, [actions, hasMorePlaces, loading, search, selectedCategory, placesPage.page]);

  const placeItems: PlaceListItemProps[] = useMemo(
    () =>
      places.map((place) => ({
        title: place.name,
        subtitle: place.description ?? undefined,
        category: place.category?.name ?? undefined,
        href: `/places/${place.id}`,
      })),
    [places]
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
