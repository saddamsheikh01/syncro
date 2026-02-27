"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Input } from "@/components/elements/Input";
import { Loader } from "@/components/elements/Loader";
import { Select } from "@/components/elements/Select";
import { SectionHeader } from "@/features/home/sections/SectionHeader";
import { MatchCard } from "@/features/matches/cards/MatchCard";
import { ConnectButton } from "@/features/matches/elements/ConnectButton";
import { InterestPickerGrid } from "@/features/onboarding/forms/InterestPickerGrid";
import { getPeople } from "@/services/people";
import type { PeopleContext, PeopleParams } from "@/services/people";
import type { UserMatchResponse } from "@/types/matches";
import { useAnalytics, useAuth, useTags, useT } from "@/hooks";
import { cx } from "@/lib/classNames";

const PAGE_SIZE = 20;
const PEOPLE_STORAGE_KEY = "syncro.people.config";

const GENDER_OPTIONS = [
  { value: "", labelKey: "Any" },
  { value: "MALE", labelKey: "Male" },
  { value: "FEMALE", labelKey: "Female" },
  { value: "NON_BINARY", labelKey: "Non-binary" },
  { value: "OTHER", labelKey: "Other" },
  { value: "PREFER_NOT_TO_SAY", labelKey: "Prefer not to say" },
];

const ORIENTATION_OPTIONS = [
  { value: "", labelKey: "Any" },
  { value: "HETERO", labelKey: "Heterosexual" },
  { value: "GAY", labelKey: "Gay" },
  { value: "BI", labelKey: "Bisexual" },
  { value: "ASEXUAL", labelKey: "Asexual" },
  { value: "OTHER", labelKey: "Other" },
];

const ZODIAC_OPTIONS = [
  { value: "", labelKey: "Any" },
  { value: "ARIES", labelKey: "Aries" },
  { value: "TAURUS", labelKey: "Taurus" },
  { value: "GEMINI", labelKey: "Gemini" },
  { value: "CANCER", labelKey: "Cancer" },
  { value: "LEO", labelKey: "Leo" },
  { value: "VIRGO", labelKey: "Virgo" },
  { value: "LIBRA", labelKey: "Libra" },
  { value: "SCORPIO", labelKey: "Scorpio" },
  { value: "SAGITTARIUS", labelKey: "Sagittarius" },
  { value: "CAPRICORN", labelKey: "Capricorn" },
  { value: "AQUARIUS", labelKey: "Aquarius" },
  { value: "PISCES", labelKey: "Pisces" },
];

const SORT_OPTIONS = [
  { value: "compatibility", labelKey: "Compatibility" },
  { value: "recently_active", labelKey: "Recently active" },
];

const CONTEXT_OPTIONS = [
  { value: "", labelKey: "Any" },
  { value: "WORK", labelKey: "Work" },
  { value: "PROJECTS", labelKey: "Projects" },
  { value: "FRIENDSHIP", labelKey: "Friendship" },
  { value: "HOBBY", labelKey: "Hobby" },
  { value: "GROWTH", labelKey: "Growth" },
  { value: "LOVE", labelKey: "Love" },
];

type StoredConfig = {
  search?: string;
  city?: string;
  country?: string;
  ageMin?: string;
  ageMax?: string;
  gender?: string;
  orientation?: string;
  zodiacSign?: string;
  interestTagIds?: string[];
  valuesText?: string;
  context?: string;
  maxDistanceKm?: string;
  sort?: string;
};

const loadStoredConfig = (): StoredConfig => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PEOPLE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredConfig;
    return parsed ?? {};
  } catch {
    return {};
  }
};

const getInitialConfig = (): StoredConfig => {
  if (typeof window === "undefined") return {};
  return loadStoredConfig();
};

const saveStoredConfig = (config: StoredConfig) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
};

export const MatchesOverview = () => {
  const { user } = useAuth();
  const { t } = useT();
  const { actions: analyticsActions } = useAnalytics();
  const { tags, actions: tagsActions } = useTags();
  const analyticsTrackedRef = useRef(false);

  const [items, setItems] = useState<UserMatchResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const [filterSearch, setFilterSearch] = useState(() => getInitialConfig().search ?? "");
  const [filterCity, setFilterCity] = useState(() => getInitialConfig().city ?? "");
  const [filterCountry, setFilterCountry] = useState(() => getInitialConfig().country ?? "");
  const [filterAgeMin, setFilterAgeMin] = useState(() => getInitialConfig().ageMin ?? "");
  const [filterAgeMax, setFilterAgeMax] = useState(() => getInitialConfig().ageMax ?? "");
  const [filterGender, setFilterGender] = useState(() => getInitialConfig().gender ?? "");
  const [filterOrientation, setFilterOrientation] = useState(() => getInitialConfig().orientation ?? "");
  const [filterZodiacSign, setFilterZodiacSign] = useState(() => getInitialConfig().zodiacSign ?? "");
  const [filterInterestTagIds, setFilterInterestTagIds] = useState<string[]>(() => getInitialConfig().interestTagIds ?? []);
  const [filterValuesText, setFilterValuesText] = useState(() => getInitialConfig().valuesText ?? "");
  const [filterContext, setFilterContext] = useState(() => getInitialConfig().context ?? "");
  const [filterMaxDistanceKm, setFilterMaxDistanceKm] = useState(() => getInitialConfig().maxDistanceKm ?? "");
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [sort, setSort] = useState(() => {
    const stored = getInitialConfig().sort ?? "compatibility";
    return stored === "distance" ? "recently_active" : stored;
  });

  const resolveErrorMessage = useCallback((err: unknown, fallback: string) => {
    if (err && typeof err === "object" && "message" in err) {
      const m = (err as { message?: string }).message;
      if (m) return String(m);
    }
    return fallback;
  }, []);

  const persistConfig = useCallback(() => {
    saveStoredConfig({
      search: filterSearch || undefined,
      city: filterCity || undefined,
      country: filterCountry || undefined,
      ageMin: filterAgeMin || undefined,
      ageMax: filterAgeMax || undefined,
      gender: filterGender || undefined,
      orientation: filterOrientation || undefined,
      zodiacSign: filterZodiacSign || undefined,
      interestTagIds: filterInterestTagIds.length ? filterInterestTagIds : undefined,
      valuesText: filterValuesText || undefined,
      context: filterContext || undefined,
      maxDistanceKm: filterMaxDistanceKm || undefined,
      sort,
    });
  }, [
    filterSearch,
    filterCity,
    filterCountry,
    filterAgeMin,
    filterAgeMax,
    filterGender,
    filterOrientation,
    filterZodiacSign,
    filterInterestTagIds,
    filterValuesText,
      filterContext,
      filterMaxDistanceKm,
      sort,
  ]);

  useEffect(() => {
    if (tags.length === 0) tagsActions.fetchTags().catch(() => undefined);
  }, [tags.length, tagsActions]);

  useEffect(() => {
    if (!analyticsTrackedRef.current) {
      analyticsTrackedRef.current = true;
      analyticsActions.trackEvent({ eventType: "MATCH_SECTION_OPENED" }).catch(() => undefined);
    }
  }, [analyticsActions]);

  const fetchPeople = useCallback(
    async (pageNum: number, append: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const maxKm = filterMaxDistanceKm.trim() ? parseFloat(filterMaxDistanceKm) : undefined;
        const params: PeopleParams = {
          page: pageNum,
          size: PAGE_SIZE,
          sort: sort === "recently_active" ? "recently_active" : "compatibility",
        };
        const q = filterSearch.trim() || undefined;
        if (q) params.q = q;
        const city = filterCity.trim() || undefined;
        if (city) params.city = city;
        const country = filterCountry.trim() || undefined;
        if (country) params.country = country;
        const ageMin = filterAgeMin.trim() ? parseInt(filterAgeMin, 10) : undefined;
        const ageMax = filterAgeMax.trim() ? parseInt(filterAgeMax, 10) : undefined;
        if (ageMin != null && !Number.isNaN(ageMin)) params.ageMin = ageMin;
        if (ageMax != null && !Number.isNaN(ageMax)) params.ageMax = ageMax;
        if (filterGender) params.gender = filterGender;
        if (filterOrientation) params.orientation = filterOrientation;
        if (filterZodiacSign) params.zodiacSign = filterZodiacSign;
        if (filterInterestTagIds.length) {
          params.interestTagIdsCsv = filterInterestTagIds.join(",");
        }
        const valuesText = filterValuesText.trim() || undefined;
        if (valuesText) params.valuesText = valuesText;
        if (filterContext && filterContext.trim()) params.context = filterContext.trim() as PeopleParams["context"];
        if (maxKm != null && !Number.isNaN(maxKm) && maxKm > 0) {
          params.maxDistanceKm = maxKm;
          if (userCoords) {
            params.latitude = userCoords.lat;
            params.longitude = userCoords.lon;
          }
        }

        const response = await getPeople(params);
        const total = response.totalElements ?? 0;
        const content = (response.content ?? []).filter((item) => item.userId !== user?.id);
        setItems((prev) => (append ? [...prev, ...content] : content));
        setPage(response.number ?? pageNum);
        setTotalElements(total);
        setTotalPages(response.totalPages ?? 0);

        if (!append && pageNum === 0 && sort === "compatibility") {
          const noResults = total === 0;
          const allNullScores = content.length > 0 && content.every((i) => i.scoreTotal == null);
          if (noResults || allNullScores) {
            setSort("recently_active");
            saveStoredConfig({ ...loadStoredConfig(), sort: "recently_active" });
          }
        }
      } catch (err) {
        setError(resolveErrorMessage(err, t("Unable to load people.")));
      } finally {
        setLoading(false);
      }
    },
    [
      filterSearch,
      filterCity,
      filterCountry,
      filterAgeMin,
      filterAgeMax,
      filterGender,
      filterOrientation,
      filterZodiacSign,
      filterInterestTagIds,
      filterValuesText,
      filterContext,
      filterMaxDistanceKm,
      userCoords,
      sort,
      user?.id,
      resolveErrorMessage,
      t,
    ]
  );

  useEffect(() => {
    fetchPeople(0, false);
  }, [fetchPeople]);

  const handleApplyFilters = useCallback(() => {
    persistConfig();
    fetchPeople(0, false).catch(() => undefined);
  }, [persistConfig, fetchPeople]);

  const handleSortChange = useCallback(
    (newSort: string) => {
      setSort(newSort);
      saveStoredConfig({ ...loadStoredConfig(), sort: newSort });
      fetchPeople(0, false).catch(() => undefined);
    },
    [fetchPeople]
  );

  const handleLoadMore = useCallback(() => {
    if (loading || page + 1 >= totalPages) return;
    fetchPeople(page + 1, true).catch(() => undefined);
  }, [loading, page, totalPages, fetchPeople]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setUserCoords(null)
    );
  }, []);

  useEffect(() => {
    if (filterMaxDistanceKm.trim() && !userCoords) requestLocation();
  }, [filterMaxDistanceKm, userCoords, requestLocation]);

  const hasMore = page + 1 < totalPages;
  const isInitialLoading = loading && items.length === 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <SectionHeader
        title={t("People & Connections")}
        subtitle={t("Connections relevant to your current moment.")}
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted">{t("Sort by")}</span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleSortChange(opt.value)}
            className={cx(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              sort === opt.value
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-surface-muted/40 text-foreground hover:bg-surface-muted"
            )}
          >
            {t(opt.labelKey)}
          </button>
        ))}
      </div>

      <Card className="mt-3 border-border/70 bg-surface-muted/40 p-3">
        <button
          type="button"
          onClick={() => setFiltersExpanded((v) => !v)}
          className="flex w-full items-center justify-between text-left text-sm font-medium text-foreground"
        >
          <span>{t("Filters")}</span>
          <span className={cx("transition-transform", filtersExpanded && "rotate-180")}>▼</span>
        </button>
        {filtersExpanded && (
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
            <div className="col-span-2 sm:col-span-3 lg:col-span-4">
              <Input
                label={t("Search (name, username or email)")}
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder={t("e.g. name, @username, or email")}
              />
            </div>
            <Input
              label={t("City")}
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              placeholder={t("e.g. Rome")}
            />
            <Input
              label={t("Country")}
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              placeholder={t("e.g. Italy")}
            />
            <Input
              type="number"
              label={t("Age min")}
              value={filterAgeMin}
              onChange={(e) => setFilterAgeMin(e.target.value)}
              placeholder="18"
              min={18}
              max={120}
            />
            <Input
              type="number"
              label={t("Age max")}
              value={filterAgeMax}
              onChange={(e) => setFilterAgeMax(e.target.value)}
              placeholder="99"
              min={18}
              max={120}
            />
            <Select
              label={t("Gender")}
              value={filterGender}
              onValueChange={setFilterGender}
              options={GENDER_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
            />
            <Select
              label={t("Orientation")}
              value={filterOrientation}
              onValueChange={setFilterOrientation}
              options={ORIENTATION_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
            />
            <Select
              label={t("Zodiac sign")}
              value={filterZodiacSign}
              onValueChange={setFilterZodiacSign}
              options={ZODIAC_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
            />
            <Select
              label={t("Context")}
              value={filterContext}
              onValueChange={setFilterContext}
              options={CONTEXT_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
            />
            <div className="col-span-2 lg:col-span-2">
              <Input
                label={t("Values (keywords)")}
                value={filterValuesText}
                onChange={(e) => setFilterValuesText(e.target.value)}
                placeholder={t("e.g. family, travel")}
              />
            </div>
            <div className="col-span-2 lg:col-span-2">
              <Input
                type="number"
                label={t("Near you (km)")}
                value={filterMaxDistanceKm}
                onChange={(e) => setFilterMaxDistanceKm(e.target.value)}
                placeholder={t("e.g. 25")}
                min={1}
              />
            </div>
            <div className="col-span-2 sm:col-span-3 lg:col-span-4">
              <InterestPickerGrid
                className="!p-3 !space-y-2"
                title={t("Interests (filter by all)")}
                subtitle={t("Show users who have all selected interests. More selections = fewer, more focused results.")}
                items={tags.map((tag) => ({
                  id: tag.id,
                  label: tag.name,
                  selected: filterInterestTagIds.includes(tag.id),
                }))}
                onItemToggle={(id, nextSelected) => {
                  setFilterInterestTagIds((prev) =>
                    nextSelected ? [...prev, id] : prev.filter((x) => x !== id)
                  );
                }}
              />
            </div>
            <div className="col-span-2 flex flex-wrap gap-2 sm:col-span-3 lg:col-span-4">
              <Button variant="primary" size="sm" onClick={handleApplyFilters} disabled={loading}>
                {t("Apply filters")}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setFilterSearch("");
                  setFilterCity("");
                  setFilterCountry("");
                  setFilterAgeMin("");
                  setFilterAgeMax("");
                  setFilterGender("");
                  setFilterOrientation("");
                  setFilterZodiacSign("");
                  setFilterInterestTagIds([]);
                  setFilterValuesText("");
                  setFilterMaxDistanceKm("");
                  setFilterContext("");
                  saveStoredConfig({});
                  setTimeout(() => fetchPeople(0, false).catch(() => undefined), 0);
                }}
                disabled={loading}
              >
                {t("Clear filters")}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div className="mt-6">
        {isInitialLoading && (
          <Card className="flex items-center gap-3 p-5">
            <Loader size="sm" />
            <p className="text-sm text-muted">{t("Loading...")}</p>
          </Card>
        )}

        {error && !isInitialLoading && (
          <>
            <ErrorState title={t("Unable to load people")} description={error} />
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => fetchPeople(0, false)}
              disabled={loading}
            >
              {t("Try again")}
            </Button>
          </>
        )}

        {!isInitialLoading && !error && items.length === 0 && (
          <EmptyState
            title={t("No people found")}
            description={t("Try adjusting filters or sort.")}
          />
        )}

        {items.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((match) => (
              <div key={match.matchId} className="flex flex-col gap-2">
                <MatchCard
                  match={match}
                  href={`/profile/${match.userId}`}
                  showDomainTag={false}
                  showScore={match.scoreTotal != null}
                  scoreLabel={t("Compatibility")}
                  onOpen={() => {
                    void analyticsActions.trackEvent({
                      eventName: "MATCH_CARD_OPENED",
                      payload: {
                        matchId: match.matchId,
                        targetUserId: match.userId,
                        scoreTotal: match.scoreTotal ?? null,
                      },
                    });
                  }}
                />
                <ConnectButton
                  userId={match.userId}
                  profileHref={`/profile/${match.userId}`}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        )}

        {hasMore && !loading && items.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Button variant="secondary" onClick={handleLoadMore}>
              {t("Load more")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
