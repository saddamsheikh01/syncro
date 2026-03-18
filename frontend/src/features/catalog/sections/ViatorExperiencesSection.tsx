"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
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
import { isViatorUnavailableError } from "@/lib/viatorErrors";
import { getExperienceDetailPath } from "@/lib/siteUrl";
import { getExperiencesWithPolling } from "@/services/catalog";
import type { ApiError } from "@/types/api";
import type { ExperienceListItemProps } from "@/features/catalog/cards/ExperienceListItem";
import type { ExperienceSummaryResponse } from "@/types/catalog";

const DEFAULT_PAGE_SIZE = 8;
const RADIUS_KM = 100;
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
  /** When true, do not show section title (e.g. when embedded in All tab). */
  hideSectionTitle?: boolean;
  /** When true, filters are provided by parent; show only content. */
  embedFilters?: boolean;
  /** City search term from parent (used when embedFilters). */
  citySearch?: string;
  /** Near me toggle from parent (used when embedFilters). */
  nearMe?: boolean;
  /** Do not show "Provider: Viator" on experience cards. */
  hideProviderLabel?: boolean;
}

export const ViatorExperiencesSection = ({
  id,
  className,
  title = "Experiences",
  subtitle = "Curated activities.",
  actionLabel,
  actionHref,
  pageSize = DEFAULT_PAGE_SIZE,
  maxItems,
  showLoadMore = true,
  hideSectionTitle = false,
  embedFilters = false,
  citySearch = "",
  nearMe = false,
  hideProviderLabel = false,
}: ViatorExperiencesSectionProps) => {
  const { t, locale } = useT();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { position, hasPosition, actions: positionActions } = usePosition();
  const initializedRef = useRef<string | null>(null);
  const fetchIdRef = useRef(0);
  const prevPathnameRef = useRef(pathname);
  const [scope, setScope] = useState<ViatorScope>("nearby");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [items, setItems] = useState<ExperienceSummaryResponse[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo>(emptyPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const effectiveSearch = embedFilters ? citySearch : searchApplied;
  const useNearbyForFetch = embedFilters ? nearMe : scope === "nearby";

  const hadPositionRef = useRef(hasPosition);
  const lastVisibilityFetchRef = useRef<number>(0);
  const VISIBILITY_REFETCH_COOLDOWN_MS = 30_000;

  // Hydrate position before any effect runs so "Near me" and fetch use coords when returning from detail.
  // useEffect (not useLayoutEffect) to avoid SSR warning: hydrate() reads localStorage, which isn't available server-side.
  useEffect(() => {
    positionActions.hydrate();
  }, [positionActions]);

  // When we navigate back from experience detail to the list, refetch so "Near me" data is restored.
  useEffect(() => {
    const placesFilter = searchParams.get("filter");
    const isListPage =
      pathname === "/experiences" ||
      (pathname === "/places" && placesFilter === "experiences");
    const wasDetailPage =
      prevPathnameRef.current?.startsWith("/experiences/") && prevPathnameRef.current !== "/experiences";
    prevPathnameRef.current = pathname;
    if (isListPage && wasDetailPage && useNearbyForFetch && hasPosition) {
      initializedRef.current = null;
      setSearchTrigger((t) => t + 1);
    }
  }, [pathname, searchParams, hasPosition, useNearbyForFetch]);

  useEffect(() => {
    if (!hasPosition && scope === "nearby") {
      setScope("everywhere");
    }
  }, [hasPosition, scope]);

  // When position becomes available (e.g. after user grants location on section entry), default to "near me".
  useEffect(() => {
    const justGotPosition = hasPosition && !hadPositionRef.current;
    hadPositionRef.current = hasPosition;
    if (justGotPosition) {
      setScope("nearby");
    }
  }, [hasPosition]);

  // When language changes, refetch with same filters/near me but new locale (bump trigger so fetch effect runs with new key).
  const prevLocaleRef = useRef(locale);
  useEffect(() => {
    if (prevLocaleRef.current !== locale) {
      prevLocaleRef.current = locale;
      setSearchTrigger((t) => t + 1);
    }
  }, [locale]);

  // When page becomes visible again (e.g. user navigated back from experience detail), refetch so "Near me" data is restored.
  // A cooldown prevents spurious refetches from rapid tab switching.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (!useNearbyForFetch || !hasPosition) return;
      const now = Date.now();
      if (now - lastVisibilityFetchRef.current < VISIBILITY_REFETCH_COOLDOWN_MS) return;
      lastVisibilityFetchRef.current = now;
      initializedRef.current = null;
      setSearchTrigger((t) => t + 1);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [hasPosition, useNearbyForFetch, VISIBILITY_REFETCH_COOLDOWN_MS]);

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
    async (page: number, append: boolean, searchOverride?: string, requestId?: number) => {
      setLoading(true);
      if (!append) {
        setError(null);
      }

      try {
        const useNearby =
          useNearbyForFetch &&
          hasPosition &&
          position?.latitude != null &&
          position?.longitude != null;
        const nearbyLat = useNearby ? (position?.latitude ?? undefined) : undefined;
        const nearbyLng = useNearby ? (position?.longitude ?? undefined) : undefined;
        const q =
          useNearby
            ? undefined
            : (searchOverride !== undefined ? (searchOverride || undefined) : (effectiveSearch || undefined));

        const response = await getExperiencesWithPolling({
          source: "VIATOR",
          q,
          lat: nearbyLat,
          lng: nearbyLng,
          radiusKm: useNearby ? RADIUS_KM : undefined,
          locale,
          page,
          size: pageSize,
        });

        if (requestId !== undefined && fetchIdRef.current !== requestId) return;

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
        if (requestId !== undefined && fetchIdRef.current !== requestId) return;
        setError(requestError as ApiError);
      } finally {
        if (requestId === undefined || fetchIdRef.current === requestId) {
          setLoading(false);
        }
      }
    },
    [effectiveSearch, hasPosition, locale, maxItems, pageSize, position?.latitude, position?.longitude, useNearbyForFetch]
  );

  const handleSearchApply = useCallback(() => {
    const applied = searchQuery.trim() || "";
    setSearchApplied(applied);
    if (applied) setScope("everywhere");
    setSearchTrigger((t) => t + 1);
  }, [searchQuery]);

  useEffect(() => {
        const fetchKey =
      useNearbyForFetch && hasPosition && position?.latitude != null && position?.longitude != null
        ? `nearby:${position.latitude}:${position.longitude}:r:${RADIUS_KM}`
        : "global";
    const key = `${fetchKey}:q:${effectiveSearch}:trigger:${searchTrigger}:locale:${locale}`;
    if (initializedRef.current === key) return;
    initializedRef.current = key;
    fetchIdRef.current += 1;
    const requestId = fetchIdRef.current;
    void fetchPage(0, false, effectiveSearch || undefined, requestId);
  }, [effectiveSearch, fetchPage, hasPosition, locale, position?.latitude, position?.longitude, searchTrigger, useNearbyForFetch]);

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
        subtitle: exp.place?.name ?? exp.locationName ?? undefined,
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
        provider: hideProviderLabel ? undefined : (exp.provider ?? "VIATOR"),
      })),
    [formatDuration, formatPrice, hideProviderLabel, items]
  );

  const showViatorUnavailable = !loading && isViatorUnavailableError(error);
  const isInitialLoading = loading && experienceItems.length === 0;

  return (
    <section id={id} className={cx("space-y-4", className)}>
      {!hideSectionTitle && (
        <SectionHeader
          title={t(title)}
          subtitle={t(subtitle)}
          actionLabel={actionLabel ? t(actionLabel) : undefined}
          actionHref={actionHref}
        />
      )}

      {!embedFilters && (
      <Card className="space-y-3 border-border/70 bg-surface-muted/30 p-4">
        <p className="text-xs font-semibold text-subtle">{t("Filters")}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div className="flex-1">
            <Input
              label={t("Search by city")}
              placeholder={t("City name...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchApply()}
            />
          </div>
          <Button onClick={handleSearchApply} disabled={loading}>
            {t("Search")}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-subtle">{t("Location")}:</span>
          <button
            type="button"
            onClick={() => {
              if (scope !== "nearby") {
                setLoading(true);
                setSearchQuery("");
                setSearchApplied("");
                setSearchTrigger((t) => t + 1);
              }
              setScope("nearby");
            }}
            disabled={!hasPosition || (scope === "nearby" && loading)}
            className={cx(
              "rounded-full border px-3 py-1 text-xs font-semibold transition",
              scope === "nearby"
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-surface text-foreground",
              (!hasPosition || (scope === "nearby" && loading)) && "cursor-wait opacity-70"
            )}
          >
            {scope === "nearby" && loading ? t("Loading…") : t("Near me")}
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
      )}

      {isInitialLoading ? (
        <Card className="flex min-h-[280px] flex-col items-center justify-center gap-4 p-8">
          <Loader size="lg" />
          <p className="text-sm font-medium text-muted">{t("Curating experiences for you")}</p>
        </Card>
      ) : null}

      {!isInitialLoading && showViatorUnavailable ? (
        <EmptyState
          title={t("Experiences temporarily unavailable")}
          description={t("Viator is temporarily unreachable. Please try again in a moment.")}
        />
      ) : null}

      {!isInitialLoading && !loading && error && !showViatorUnavailable ? (
        <ErrorState
          title={t("Unable to load experiences")}
          description={
            scope === "nearby" && useNearbyForFetch
              ? t("Experiences for your area are still loading. Please try again in a few minutes.")
              : error.message
          }
        />
      ) : null}

      {!isInitialLoading && !loading && !error && !showViatorUnavailable && experienceItems.length === 0 ? (
        <EmptyState
          title={t("No experiences found")}
          description={t("No Viator experiences available right now.")}
        />
      ) : null}

      {!isInitialLoading && experienceItems.length > 0 ? (
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
