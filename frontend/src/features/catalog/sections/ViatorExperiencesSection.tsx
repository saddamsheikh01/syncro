"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Input } from "@/components/elements/Input";
import { Loader } from "@/components/elements/Loader";
import { MapExperienceListItem } from "@/features/catalog/lists/MapExperienceListItem";
import { SectionHeader } from "@/features/home/sections/SectionHeader";
import { usePosition, useT } from "@/hooks";
import { toBcp47 } from "@/i18n/locales";
import { cx } from "@/lib/classNames";
import { getCategories, getExperiences } from "@/services/catalog";
import type { ApiError } from "@/types/api";
import type { ExperienceListItemProps } from "@/features/catalog/cards/ExperienceListItem";
import type { CategoryResponse, ExperienceSummaryResponse } from "@/types/catalog";

const DEFAULT_PAGE_SIZE = 8;
type ViatorScope = "nearby" | "everywhere";

type PageInfo = {
  page: number;
  totalPages: number;
  totalElements: number;
};

const emptyPage: PageInfo = {
  page: 0,
  totalPages: 0,
  totalElements: 0,
};

export interface ViatorExperiencesSectionProps {
  id?: string;
  className?: string;
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  pageSize?: number;
  maxItems?: number;
  showLoadMore?: boolean;
}

export const ViatorExperiencesSection = ({
  id,
  className,
  title = "Experiences",
  subtitle = "Curated activities powered by Viator.",
  actionLabel,
  actionHref,
  pageSize = DEFAULT_PAGE_SIZE,
  maxItems,
  showLoadMore = true,
}: ViatorExperiencesSectionProps) => {
  const { t, locale } = useT();
  const { position, hasPosition } = usePosition();
  const initializedRef = useRef<string | null>(null);
  const [scope, setScope] = useState<ViatorScope>("nearby");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [items, setItems] = useState<ExperienceSummaryResponse[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo>(emptyPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (!hasPosition && scope === "nearby") {
      setScope("everywhere");
    }
  }, [hasPosition, scope]);

  useEffect(() => {
    getCategories({ size: 50 })
      .then((res) => setCategories(res.content ?? []))
      .catch(() => setCategories([]));
  }, []);

  const formatDuration = useCallback((minutes: number | null): string | undefined => {
    if (!minutes) return undefined;
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }, []);

  const formatPrice = useCallback(
    (price: number | null, currency: string | null): string | undefined => {
      if (price == null) return undefined;
      const curr = currency ?? "EUR";
      return new Intl.NumberFormat(toBcp47(locale), {
        style: "currency",
        currency: curr,
      }).format(price);
    },
    [locale]
  );

  const fetchPage = useCallback(
    async (page: number, append: boolean) => {
      setLoading(true);
      if (!append) {
        setError(null);
      }

      try {
        const useNearby =
          scope === "nearby" &&
          hasPosition &&
          position?.latitude != null &&
          position?.longitude != null;
        const nearbyLat = useNearby ? (position?.latitude ?? undefined) : undefined;
        const nearbyLng = useNearby ? (position?.longitude ?? undefined) : undefined;

        const response = await getExperiences({
          source: "VIATOR",
          q: searchApplied || undefined,
          categoryId: selectedCategoryId || undefined,
          lat: nearbyLat,
          lng: nearbyLng,
          page,
          size: pageSize,
        });

        const viatorItems = response.content.filter(
          (exp) => exp.source === "VIATOR" || exp.provider?.toUpperCase() === "VIATOR"
        );

        setItems((previous) => {
          const merged = append ? [...previous, ...viatorItems] : viatorItems;
          return maxItems != null ? merged.slice(0, maxItems) : merged;
        });
        setPageInfo({
          page: response.number,
          totalPages: response.totalPages,
          totalElements: response.totalElements,
        });
      } catch (requestError) {
        setError(requestError as ApiError);
      } finally {
        setLoading(false);
      }
    },
    [hasPosition, maxItems, pageSize, position?.latitude, position?.longitude, scope, searchApplied, selectedCategoryId]
  );

  const handleSearchApply = useCallback(() => {
    setSearchApplied(searchQuery.trim() || "");
  }, [searchQuery]);

  const handleCategoryChange = useCallback((categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
  }, []);

  useEffect(() => {
    const fetchKey =
      scope === "nearby" && hasPosition && position?.latitude != null && position?.longitude != null
        ? `nearby:${position.latitude}:${position.longitude}`
        : `${scope}:global`;
    const key = `${fetchKey}:q:${searchApplied}:cat:${selectedCategoryId ?? "all"}`;
    if (initializedRef.current === key) return;
    initializedRef.current = key;
    void fetchPage(0, false);
  }, [fetchPage, hasPosition, position?.latitude, position?.longitude, scope, searchApplied, selectedCategoryId]);

  const hasMore = useMemo(() => {
    const pageHasMore = pageInfo.page + 1 < pageInfo.totalPages;
    const maxLimitReached = maxItems != null && items.length >= maxItems;
    return pageHasMore && !maxLimitReached;
  }, [items.length, maxItems, pageInfo.page, pageInfo.totalPages]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loading) return;
    void fetchPage(pageInfo.page + 1, true);
  }, [fetchPage, hasMore, loading, pageInfo.page]);

  const experienceItems: ExperienceListItemProps[] = useMemo(
    () =>
      items.map((exp) => ({
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
        provider: exp.provider ?? "VIATOR",
      })),
    [formatDuration, formatPrice, items]
  );

  const isInitialLoading = loading && items.length === 0;

  return (
    <section id={id} className={cx("space-y-4", className)}>
      <SectionHeader
        title={t(title)}
        subtitle={t(subtitle)}
        actionLabel={actionLabel ? t(actionLabel) : undefined}
        actionHref={actionHref}
      />

      <Card className="space-y-3 border-border/70 bg-surface-muted/30 p-4">
        <p className="text-xs font-semibold text-subtle">{t("Filters")}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div className="flex-1">
            <Input
              label={t("Search experiences")}
              placeholder={t("Name or description...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchApply()}
            />
          </div>
          <Button onClick={handleSearchApply} disabled={loading}>
            {t("Search")}
          </Button>
        </div>
        {categories.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleCategoryChange(null)}
              className={cx(
                "rounded-full px-3 py-1.5 text-xs font-medium transition",
                selectedCategoryId === null
                  ? "bg-accent text-accent-foreground"
                  : "bg-surface-muted text-foreground hover:bg-border"
              )}
            >
              {t("All")}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={cx(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition",
                  selectedCategoryId === cat.id
                    ? "bg-accent text-accent-foreground"
                    : "bg-surface-muted text-foreground hover:bg-border"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-subtle">{t("Location")}:</span>
          <button
            type="button"
            onClick={() => setScope("nearby")}
            disabled={!hasPosition}
            className={cx(
              "rounded-full border px-3 py-1 text-xs font-semibold transition",
              scope === "nearby"
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-surface text-foreground",
              !hasPosition && "cursor-not-allowed opacity-50"
            )}
          >
            {t("Near me")}
          </button>
          <button
            type="button"
            onClick={() => setScope("everywhere")}
            className={cx(
              "rounded-full border px-3 py-1 text-xs font-semibold transition",
              scope === "everywhere"
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-surface text-foreground"
            )}
          >
            {t("Anywhere")}
          </button>
        </div>
      </Card>

      {isInitialLoading ? (
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">{t("Loading experiences...")}</p>
        </Card>
      ) : null}

      {!isInitialLoading && error ? (
        <ErrorState
          title={t("Unable to load experiences")}
          description={error.message}
        />
      ) : null}

      {!isInitialLoading && !error && experienceItems.length === 0 ? (
        <EmptyState
          title={t("No experiences found")}
          description={t("No Viator experiences available right now.")}
        />
      ) : null}

      {experienceItems.length > 0 ? (
        <>
          <MapExperienceListItem
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            items={experienceItems}
          />

          {showLoadMore && hasMore ? (
            <div className="flex justify-center">
              <Button
                variant="secondary"
                onClick={handleLoadMore}
                loading={loading}
                loadingText={t("Loading")}
              >
                {t("Load more experiences")}
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
};
