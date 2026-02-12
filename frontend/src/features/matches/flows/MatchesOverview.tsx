"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { SectionHeader } from "@/features/home/sections/SectionHeader";
import { MatchCard } from "@/features/matches/cards/MatchCard";
import { MatchTypeChip } from "@/features/matches/elements/MatchTypeChip";
import { getDomainFilterItems, getMatchDomainMeta } from "@/lib/matchDomains";
import type { DomainFilter } from "@/lib/matchDomains";
import { searchUsers } from "@/services/users";
import type { UserMatchResponse } from "@/types/matches";
import type { UserSummaryResponse } from "@/types/profile";
import { useAnalytics, useAuth, useMatches } from "@/hooks";

const PAGE_SIZE = 20;
const DOMAIN_FILTER_ITEMS = getDomainFilterItems();
const NO_MATCH_CARD_DESCRIPTION =
  "Public profile available. No computed match yet.";
const EMPTY_PAGE = {
  page: 0,
  size: 0,
  totalPages: 0,
  totalElements: 0,
};
type ViewMode = "MATCHES" | "ALL_USERS";

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
  const {
    userMatches,
    userMatchesPage,
    loadingUserMatches,
    error,
    hasMoreUserMatches,
    actions: matchesActions,
  } = useMatches();
  const { actions: analyticsActions } = useAnalytics();
  const analyticsTrackedRef = useRef(false);
  const [selectedDomain, setSelectedDomain] = useState<DomainFilter>("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("MATCHES");
  const [allUsers, setAllUsers] = useState<UserSummaryResponse[]>([]);
  const [allUsersPage, setAllUsersPage] = useState(EMPTY_PAGE);
  const [loadingAllUsers, setLoadingAllUsers] = useState(false);
  const [allUsersError, setAllUsersError] = useState<string | null>(null);

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

  const fetchAllUsers = useCallback(
    async (page: number, append: boolean) => {
      setLoadingAllUsers(true);
      setAllUsersError(null);
      try {
        const response = await searchUsers({ q: "", page, size: PAGE_SIZE });
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
          resolveErrorMessage(fetchError, "Unable to load all users.")
        );
      } finally {
        setLoadingAllUsers(false);
      }
    },
    [resolveErrorMessage, user?.id]
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
        ? "Overall"
        : getMatchDomainMeta(selectedDomain).label,
    [selectedDomain]
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <SectionHeader
        title="People & Connections"
        subtitle="Connections relevant to your current moment."
        actionLabel="View Connections"
        actionHref="/matches"
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <MatchTypeChip
          label="✨ Match mode"
          selected={viewMode === "MATCHES"}
          onToggleState={(nextSelected) => {
            if (!nextSelected) return;
            setViewMode("MATCHES");
          }}
        />
        <MatchTypeChip
          label="🌐 All users (no filters)"
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
          {DOMAIN_FILTER_ITEMS.map((domain) => (
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
          <p className="text-sm text-muted">
            Filters disabled. You are viewing all public profiles, including users
            without a computed match score.
          </p>
        </Card>
      )}

      <div className="mt-6">
        {isInitialLoading && (
          <Card className="flex items-center gap-3 p-5">
            <Loader size="sm" />
            <p className="text-sm text-muted">Loading matches...</p>
          </Card>
        )}

        {currentErrorMessage && !isInitialLoading && (
          <div className="space-y-3">
            <ErrorState
              title={
                viewMode === "ALL_USERS"
                  ? "Unable to load users"
                  : "Unable to load matches"
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
              Try again
            </Button>
          </div>
        )}

        {!isInitialLoading && !currentErrorMessage && displayedItems.length === 0 && (
          <EmptyState
            title={
              viewMode === "ALL_USERS"
                ? "No public users found"
                : "No matches available"
            }
            description={
              viewMode === "ALL_USERS"
                ? "No public profiles are available right now."
                : "Complete your passions or tests to generate new suggestions."
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
                  viewMode === "ALL_USERS" ? NO_MATCH_CARD_DESCRIPTION : undefined
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
              Load more
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
