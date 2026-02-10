"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { SectionHeader } from "@/features/home/sections/SectionHeader";
import { MatchCard } from "@/features/matches/cards/MatchCard";
import type { UserMatchResponse } from "@/types/matches";
import { useAnalytics, useMatches } from "@/hooks";

const PAGE_SIZE = 20;

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
  const {
    userMatches,
    userMatchesPage,
    loadingUserMatches,
    error,
    hasMoreUserMatches,
    actions: matchesActions,
  } = useMatches();
  const { actions: analyticsActions } = useAnalytics();
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    matchesActions.fetchUserMatches({ size: PAGE_SIZE, refresh: true }).catch(() => undefined);
    analyticsActions
      .trackEvent({ eventType: "MATCH_SECTION_OPENED" })
      .catch(() => undefined);
  }, [matchesActions, analyticsActions]);

  const sortedMatches = useMemo(
    () => sortMatchesByScore(userMatches),
    [userMatches]
  );

  const handleLoadMore = useCallback(() => {
    if (!hasMoreUserMatches || loadingUserMatches) return;
    matchesActions
      .fetchUserMatches(
        { page: userMatchesPage.page + 1, size: PAGE_SIZE },
        { append: true }
      )
      .catch(() => undefined);
  }, [hasMoreUserMatches, loadingUserMatches, matchesActions, userMatchesPage.page]);

  const isInitialLoading = loadingUserMatches && userMatches.length === 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <SectionHeader
        title="People & Connections"
        subtitle="Connections relevant to your current moment."
        actionLabel="View Connections"
        actionHref="/matches"
      />

      {/* TODO: filtri match — da implementare con logica reale
      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-full border border-border/70 bg-surface px-3 py-2 text-xs text-muted">
        <span className="font-semibold text-foreground">Fine-Tune</span>
        <span>Age Range</span>
        <span className="text-subtle">30 - 40</span>
        <span>Nearby</span>
        <span className="text-subtle">Anywhere</span>
        <span>Distance</span>
        <span className="text-subtle">10 Km</span>
        <span>Gender</span>
        <span className="text-subtle">All</span>
        <span>Interested In</span>
        <span className="text-subtle">All</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {["Work", "Goals", "Friends", "Share Interests", "Learn & Grow", "Relationships"].map((label) => (
          <span
            key={label}
            className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-foreground shadow-sm"
          >
            {label}
          </span>
        ))}
      </div>
      */}

      <div className="mt-6">
        {isInitialLoading && (
          <Card className="flex items-center gap-3 p-5">
            <Loader size="sm" />
            <p className="text-sm text-muted">Loading matches...</p>
          </Card>
        )}

        {error && !isInitialLoading && (
          <div className="space-y-3">
            <ErrorState
              title="Unable to load matches"
              description={error.message}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => matchesActions.fetchUserMatches({ size: PAGE_SIZE }).catch(() => undefined)}
              disabled={loadingUserMatches}
            >
              Try again
            </Button>
          </div>
        )}

        {!isInitialLoading && !error && sortedMatches.length === 0 && (
          <EmptyState
            title="No matches available"
            description="Complete your passions or tests to generate new suggestions."
          />
        )}

        {sortedMatches.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedMatches.map((match) => (
              <MatchCard
                key={match.matchId}
                match={match}
                href={`/profile/${match.userId}`}
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

        {hasMoreUserMatches && !loadingUserMatches && sortedMatches.length > 0 ? (
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
