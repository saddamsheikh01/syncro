"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Input } from "@/components/elements/Input";
import { Loader } from "@/components/elements/Loader";
import { Select } from "@/components/elements/Select";
import { SectionHeader } from "@/features/home/sections/SectionHeader";
import { MatchCard } from "@/features/matches/cards/MatchCard";
import { MatchTypeChip } from "@/features/matches/elements/MatchTypeChip";
import { InterestPickerGrid } from "@/features/onboarding/forms/InterestPickerGrid";
import { getDomainFilterItems, getMatchDomainMeta } from "@/lib/matchDomains";
import type { DomainFilter } from "@/lib/matchDomains";
import { searchUsers } from "@/services/users";
import type { UserSearchParams } from "@/services/users";
import type { UserMatchResponse } from "@/types/matches";
import type { UserSummaryResponse } from "@/types/profile";
import { useAnalytics, useAuth, useMatches, useTags, useT } from "@/hooks";
import { cx } from "@/lib/classNames";

const PAGE_SIZE = 20;
const EMPTY_PAGE = {
  page: 0,
  size: 0,
  totalPages: 0,
  totalElements: 0,
};
type ViewMode = "MATCHES" | "ALL_USERS";

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

const sortMatchesByScore = (matches: UserMatchResponse[]) =>
  [...matches].sort((a, b) => {
    const scoreA = a.scoreTotal ?? 0;
    const scoreB = b.scoreTotal ?? 0;
    if (scoreA === scoreB) {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    return scoreB - scoreA;
  });

export const MatchesOverview = () => {
  const { user } = useAuth();
  const { t } = useT();
  const {
    userMatches,
    userMatchesPage,
    loadingUserMatches,
    error,
    hasMoreUserMatches,
    actions: matchesActions,
  } = useMatches();
  const { actions: analyticsActions } = useAnalytics();
  const { tags, actions: tagsActions } = useTags();
  const analyticsTrackedRef = useRef(false);
  const [selectedDomain, setSelectedDomain] = useState<DomainFilter>("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("MATCHES");
  const [allUsers, setAllUsers] = useState<UserSummaryResponse[]>([]);
  const [allUsersPage, setAllUsersPage] = useState(EMPTY_PAGE);
  const [loadingAllUsers, setLoadingAllUsers] = useState(false);
  const [allUsersError, setAllUsersError] = useState<string | null>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [filterCity, setFilterCity] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterAgeMin, setFilterAgeMin] = useState("");
  const [filterAgeMax, setFilterAgeMax] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterOrientation, setFilterOrientation] = useState("");
  const [filterZodiacSign, setFilterZodiacSign] = useState("");
  const [filterInterestTagIds, setFilterInterestTagIds] = useState<string[]>([]);
  const [filterValuesText, setFilterValuesText] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  const resolveErrorMessage = useCallback(
    (error: unknown, fallback: string) => {
      if (error && typeof error === "object" && "message" in error) {
        const message = (error as { message?: string }).message;
        if (message) return String(message);
      }
      return fallback;
    },
    []
  );

  const buildSearchParams = useCallback((): UserSearchParams => {
    const params: UserSearchParams = { page: 0, size: PAGE_SIZE };
    const q = filterSearch.trim() || undefined;
    if (q) params.q = q;
    const city = filterCity.trim() || undefined;
    const country = filterCountry.trim() || undefined;
    if (city) params.city = city;
    if (country) params.country = country;
    const ageMin = filterAgeMin.trim() ? parseInt(filterAgeMin, 10) : undefined;
    const ageMax = filterAgeMax.trim() ? parseInt(filterAgeMax, 10) : undefined;
    if (ageMin != null && !Number.isNaN(ageMin)) params.ageMin = ageMin;
    if (ageMax != null && !Number.isNaN(ageMax)) params.ageMax = ageMax;
    if (filterGender) params.gender = filterGender;
    if (filterOrientation) params.orientation = filterOrientation;
    if (filterZodiacSign) params.zodiacSign = filterZodiacSign;
    if (filterInterestTagIds.length) params.interestTagIds = filterInterestTagIds;
    const valuesText = filterValuesText.trim() || undefined;
    if (valuesText) params.valuesText = valuesText;
    return params;
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
  ]);

  const fetchAllUsers = useCallback(
    async (page: number, append: boolean) => {
      setLoadingAllUsers(true);
      setAllUsersError(null);
      try {
        const baseParams = buildSearchParams();
        const response = await searchUsers({
          ...baseParams,
          page,
          size: PAGE_SIZE,
        });
        const filteredContent = (response.content ?? []).filter(
          (item) => item.userId !== user?.id
        );
        setAllUsers((prev) => {
          const next = append ? [...prev, ...filteredContent] : filteredContent;
          const deduped = new Map(next.map((item) => [item.userId, item]));
          return Array.from(deduped.values());
        });
        setAllUsersPage({
          page: response.number,
          size: response.size,
          totalPages: response.totalPages,
          totalElements: response.totalElements,
        });
      } catch (fetchError) {
        setAllUsersError(
          resolveErrorMessage(fetchError, t("Unable to load all users."))
        );
      } finally {
        setLoadingAllUsers(false);
      }
    },
    [buildSearchParams, resolveErrorMessage, t, user?.id]
  );

  useEffect(() => {
    if (viewMode !== "MATCHES") return;
    matchesActions
      .fetchUserMatches({
        size: PAGE_SIZE,
        refresh: true,
        domain: selectedDomain === "ALL" ? undefined : selectedDomain,
      })
      .catch(() => undefined);
  }, [matchesActions, selectedDomain, viewMode]);

  useEffect(() => {
    if (viewMode !== "ALL_USERS") return;
    fetchAllUsers(0, false).catch(() => undefined);
  }, [fetchAllUsers, viewMode]);

  useEffect(() => {
    if (viewMode === "ALL_USERS" && tags.length === 0) {
      tagsActions.fetchTags().catch(() => undefined);
    }
  }, [viewMode, tags.length, tagsActions]);

  useEffect(() => {
    if (analyticsTrackedRef.current) return;
    analyticsTrackedRef.current = true;
    analyticsActions
      .trackEvent({ eventType: "MATCH_SECTION_OPENED" })
      .catch(() => undefined);
  }, [analyticsActions]);

  const sortedMatches = useMemo(
    () => sortMatchesByScore(userMatches),
    [userMatches]
  );
  const allUsersAsMatches = useMemo<UserMatchResponse[]>(
    () =>
      allUsers.map((item) => ({
        matchId: `no-match-${item.userId}`,
        userId: item.userId,
        user: {
          userId: item.userId,
          username: item.username,
          fullName: item.fullName,
          city: item.city,
          country: item.country,
          avatarUrl: item.avatarUrl,
          visibility: item.visibility,
        },
        scoreTotal: null,
        breakdown: null,
        explanation: null,
        createdAt: "1970-01-01T00:00:00Z",
        updatedAt: "1970-01-01T00:00:00Z",
      })),
    [allUsers]
  );
  const displayedItems =
    viewMode === "ALL_USERS" ? allUsersAsMatches : sortedMatches;
  const hasMoreAllUsers = allUsersPage.page + 1 < allUsersPage.totalPages;
  const hasMoreCurrent =
    viewMode === "ALL_USERS" ? hasMoreAllUsers : hasMoreUserMatches;
  const isLoadingCurrent =
    viewMode === "ALL_USERS" ? loadingAllUsers : loadingUserMatches;
  const currentErrorMessage =
    viewMode === "ALL_USERS" ? allUsersError : error?.message;
  const domainFilterItems = useMemo(
    () => getDomainFilterItems(t),
    [t],
  );

  const handleLoadMore = useCallback(() => {
    if (viewMode === "ALL_USERS") {
      if (!hasMoreAllUsers || loadingAllUsers) return;
      fetchAllUsers(allUsersPage.page + 1, true).catch(() => undefined);
      return;
    }

    if (!hasMoreUserMatches || loadingUserMatches) return;
    matchesActions
      .fetchUserMatches(
        {
          page: userMatchesPage.page + 1,
          size: PAGE_SIZE,
          domain: selectedDomain === "ALL" ? undefined : selectedDomain,
        },
        { append: true }
      )
      .catch(() => undefined);
  }, [
    allUsersPage.page,
    fetchAllUsers,
    hasMoreAllUsers,
    hasMoreUserMatches,
    loadingAllUsers,
    loadingUserMatches,
    matchesActions,
    selectedDomain,
    userMatchesPage.page,
    viewMode,
  ]);

  const isInitialLoading = isLoadingCurrent && displayedItems.length === 0;
  const matchScoreLabel = useMemo(
    () =>
      selectedDomain === "ALL"
        ? t("Overall")
        : t(getMatchDomainMeta(selectedDomain).label),
    [selectedDomain, t]
  );
  const noMatchCardDescription = t("Public profile available. No computed match yet.");

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <SectionHeader
        title={t("People & Connections")}
        subtitle={t("Connections relevant to your current moment.")}
        actionLabel={t("View Connections")}
        actionHref="/matches"
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <MatchTypeChip
          label={t("✨ Match mode")}
          selected={viewMode === "MATCHES"}
          onToggleState={(nextSelected) => {
            if (!nextSelected) return;
            setViewMode("MATCHES");
          }}
        />
        <MatchTypeChip
          label={t("🌐 All users")}
          selected={viewMode === "ALL_USERS"}
          onToggleState={(nextSelected) => {
            if (!nextSelected) return;
            setSelectedDomain("ALL");
            setViewMode("ALL_USERS");
          }}
        />
      </div>

      {viewMode === "MATCHES" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {domainFilterItems.map((domain) => (
            <MatchTypeChip
              key={domain.id}
              label={domain.label}
              selected={selectedDomain === domain.id}
              onToggleState={(nextSelected) => {
                if (!nextSelected) return;
                setSelectedDomain(domain.id);
              }}
            />
          ))}
        </div>
      ) : (
        <Card className="mt-3 border-border/70 bg-surface-muted/40 p-3">
          <button
            type="button"
            onClick={() => setFiltersExpanded((v) => !v)}
            className="flex w-full items-center justify-between text-left text-sm font-medium text-foreground"
          >
            <span>{t("Filters")}</span>
            <span className={cx("transition-transform", filtersExpanded && "rotate-180")}>
              ▼
            </span>
          </button>
          {filtersExpanded && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-2 lg:col-span-3">
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
                placeholder={t("e.g. Milan")}
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
                options={GENDER_OPTIONS.map((o) => ({
                  value: o.value,
                  label: t(o.labelKey),
                }))}
              />
              <Select
                label={t("Orientation")}
                value={filterOrientation}
                onValueChange={setFilterOrientation}
                options={ORIENTATION_OPTIONS.map((o) => ({
                  value: o.value,
                  label: t(o.labelKey),
                }))}
              />
              <Select
                label={t("Zodiac sign")}
                value={filterZodiacSign}
                onValueChange={setFilterZodiacSign}
                options={ZODIAC_OPTIONS.map((o) => ({
                  value: o.value,
                  label: t(o.labelKey),
                }))}
              />
              <div className="sm:col-span-2 lg:col-span-3">
                <Input
                  label={t("Values (keywords)")}
                  value={filterValuesText}
                  onChange={(e) => setFilterValuesText(e.target.value)}
                  placeholder={t("e.g. family, travel")}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <InterestPickerGrid
                  title={t("Interests (filter by any)")}
                  subtitle={t("Select interests to show users who have at least one.")}
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
              <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => fetchAllUsers(0, false).catch(() => undefined)}
                  disabled={loadingAllUsers}
                >
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
                    setTimeout(() => fetchAllUsers(0, false).catch(() => undefined), 0);
                  }}
                  disabled={loadingAllUsers}
                >
                  {t("Clear filters")}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      <div className="mt-6">
        {isInitialLoading && (
          <Card className="flex items-center gap-3 p-5">
            <Loader size="sm" />
            <p className="text-sm text-muted">{t("Loading matches...")}</p>
          </Card>
        )}

        {currentErrorMessage && !isInitialLoading && (
          <div className="space-y-3">
            <ErrorState
              title={
                viewMode === "ALL_USERS"
                  ? t("Unable to load users")
                  : t("Unable to load matches")
              }
              description={currentErrorMessage ?? undefined}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                viewMode === "ALL_USERS"
                  ? fetchAllUsers(0, false).catch(() => undefined)
                  : matchesActions
                      .fetchUserMatches({
                        size: PAGE_SIZE,
                        refresh: true,
                        domain: selectedDomain === "ALL" ? undefined : selectedDomain,
                      })
                      .catch(() => undefined)
              }
              disabled={isLoadingCurrent}
            >
              {t("Try again")}
            </Button>
          </div>
        )}

        {!isInitialLoading && !currentErrorMessage && displayedItems.length === 0 && (
          <EmptyState
            title={
              viewMode === "ALL_USERS"
                ? t("No public users found")
                : t("No matches available")
            }
            description={
              viewMode === "ALL_USERS"
                ? t("No public profiles are available right now.")
                : t("Complete your passions or tests to generate new suggestions.")
            }
          />
        )}

        {displayedItems.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayedItems.map((match) => (
              <MatchCard
                key={match.matchId}
                match={match}
                href={`/profile/${match.userId}`}
                showDomainTag={viewMode !== "ALL_USERS"}
                showScore={viewMode !== "ALL_USERS"}
                scoreLabel={matchScoreLabel}
                descriptionOverride={
                  viewMode === "ALL_USERS" ? noMatchCardDescription : undefined
                }
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
            ))}
          </div>
        ) : null}

        {hasMoreCurrent && !isLoadingCurrent && displayedItems.length > 0 ? (
          <div className="mt-6 flex justify-center">
            <Button variant="secondary" onClick={handleLoadMore}>
              {t("Load more")}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
