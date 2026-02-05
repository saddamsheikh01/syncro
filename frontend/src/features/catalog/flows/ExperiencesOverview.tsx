"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/elements/Card";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { Button } from "@/components/buttons/Button";
import { Input } from "@/components/elements/Input";
import { MapExperienceListItem } from "@/features/catalog/lists/MapExperienceListItem";
import { useCatalog } from "@/hooks";
import type { ExperienceListItemProps } from "@/features/catalog/cards/ExperienceListItem";

const PAGE_SIZE = 10;

export const ExperiencesOverview = () => {
  const {
    experiences,
    experiencesPage,
    categories,
    loading,
    error,
    hasMoreExperiences,
    actions,
  } = useCatalog();
  const bootstrappedRef = useRef(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    actions.fetchCategories({ size: 50 }).catch(() => undefined);
    actions.fetchExperiences({ size: PAGE_SIZE }).catch(() => undefined);
  }, [actions]);

  const handleSearch = useCallback(() => {
    actions
      .fetchExperiences({
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
        .fetchExperiences({
          q: search || undefined,
          categoryId: categoryId || undefined,
          size: PAGE_SIZE,
        })
        .catch(() => undefined);
    },
    [actions, search]
  );

  const handleLoadMore = useCallback(() => {
    if (!hasMoreExperiences || loading) return;
    actions
      .fetchExperiences(
        {
          q: search || undefined,
          categoryId: selectedCategory || undefined,
          page: experiencesPage.page + 1,
          size: PAGE_SIZE,
        },
        { append: true }
      )
      .catch(() => undefined);
  }, [
    actions,
    hasMoreExperiences,
    loading,
    search,
    selectedCategory,
    experiencesPage.page,
  ]);

  const formatDuration = (minutes: number | null): string | undefined => {
    if (!minutes) return undefined;
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const formatPrice = (
    price: number | null,
    currency: string | null
  ): string | undefined => {
    if (price == null) return undefined;
    const curr = currency ?? "EUR";
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: curr,
    }).format(price);
  };

  const experienceItems: ExperienceListItemProps[] = useMemo(
    () =>
      experiences.map((exp) => ({
        title: exp.name,
        subtitle: exp.locationName ?? exp.place?.name ?? undefined,
        category: exp.category?.name ?? undefined,
        href: `/experiences/${exp.id}`,
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

  const isInitialLoading = loading && experiences.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
          Catalog
        </p>
        <h1 className="text-3xl font-semibold text-foreground">Experiences</h1>
        <p className="text-sm text-muted">
          Discover unique experiences selected for you.
        </p>
      </header>

      <Card className="space-y-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Search"
              placeholder="Name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            Search
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
              All
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
          <p className="text-sm text-muted">Loading experiences...</p>
        </Card>
      )}

      {error && !isInitialLoading && (
        <ErrorState
          title="Unable to load experiences"
          description={error.message}
        />
      )}

      {!isInitialLoading && !error && experiences.length === 0 && (
        <EmptyState
          title="No experiences found"
          description="Try adjusting your search filters."
        />
      )}

      {experiences.length > 0 && (
        <>
          <MapExperienceListItem items={experienceItems} />
          {hasMoreExperiences && (
            <div className="flex justify-center">
              <Button
                variant="secondary"
                onClick={handleLoadMore}
                loading={loading}
                loadingText="Loading"
              >
                Load more experiences
              </Button>
            </div>
          )}
        </>
      )}

      {experiencesPage.totalElements > 0 && (
        <p className="text-center text-xs text-subtle">
          {experiences.length} of {experiencesPage.totalElements} experiences
        </p>
      )}
    </div>
  );
};
