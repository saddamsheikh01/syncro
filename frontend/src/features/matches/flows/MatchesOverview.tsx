"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { MatchFilterBar } from "@/features/matches/sections/MatchFilterBar";
import { MatchDetailPanel } from "@/features/matches/sections/MatchDetailPanel";
import { MatchListItem } from "@/features/matches/elements/MatchListItem";
import type { MatchInsightItemProps } from "@/features/matches/elements/MatchInsightItem";
import type { UserMatchResponse } from "@/types/matches";
import { useAnalytics, useChat, useMatches } from "@/hooks";

const PAGE_SIZE = 20;

const MATCH_SORT_OPTIONS = [
  { label: "Punteggio", value: "score" },
  { label: "Più recenti", value: "recent" },
];

const getDisplayName = (match: UserMatchResponse) => {
  const fullName = match.user?.fullName?.trim();
  if (fullName) return fullName;
  const suffix = match.userId.slice(0, 6);
  return `Utente ${suffix}`;
};

const getLocation = (match: UserMatchResponse) => {
  const city = match.user?.city?.trim();
  const country = match.user?.country?.trim();
  const parts = [city, country].filter(Boolean);
  return parts.length ? parts.join(", ") : undefined;
};

const mapTags = (match: UserMatchResponse): string[] => {
  const tags: string[] = [];
  const sharedTags = match.breakdown?.["sharedTags"];
  if (typeof sharedTags === "number") {
    tags.push(`${sharedTags} interessi in comune`);
  }
  return tags;
};

const mapInsights = (match: UserMatchResponse): MatchInsightItemProps[] => {
  const insights: MatchInsightItemProps[] = [];
  const sharedTags = match.breakdown?.["sharedTags"];
  if (typeof sharedTags === "number") {
    insights.push({
      title: "Interessi",
      description: `${sharedTags} tag condivisi`,
      tone: "accent",
    });
  }
  if (match.explanation) {
    insights.push({
      title: "Perché questo match",
      description: match.explanation,
      tone: "neutral",
    });
  }
  return insights;
};

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
  const { actions: chatActions, loadingConversations } = useChat();
  const router = useRouter();

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortValue, setSortValue] = useState<string>("score");
  const bootstrappedRef = useRef(false);
  const [startingChat, setStartingChat] = useState(false);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    matchesActions.fetchUserMatches({ size: PAGE_SIZE }).catch(() => undefined);
    analyticsActions
      .trackEvent({ eventType: "MATCH_SECTION_OPENED" })
      .catch(() => undefined);
  }, [matchesActions, analyticsActions]);

  useEffect(() => {
    if (selectedMatchId || userMatches.length === 0) return;
    setSelectedMatchId(userMatches[0].matchId);
  }, [userMatches, selectedMatchId]);

  const filteredMatches = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = [...userMatches];
    if (query) {
      list = list.filter((match) => {
        const name = getDisplayName(match).toLowerCase();
        const explanation = match.explanation?.toLowerCase() ?? "";
        return name.includes(query) || explanation.includes(query);
      });
    }
    list.sort((a, b) => {
      if (sortValue === "recent") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      const scoreA = a.scoreTotal ?? 0;
      const scoreB = b.scoreTotal ?? 0;
      if (scoreA === scoreB) {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return scoreB - scoreA;
    });
    return list;
  }, [userMatches, search, sortValue]);

  const selectedMatch = useMemo(
    () =>
      filteredMatches.find((item) => item.matchId === selectedMatchId) ??
      filteredMatches[0] ??
      null,
    [filteredMatches, selectedMatchId]
  );

  const handleRefresh = useCallback(() => {
    matchesActions
      .fetchUserMatches({ size: PAGE_SIZE, refresh: true })
      .catch(() => undefined);
  }, [matchesActions]);

  const handleLoadMore = useCallback(() => {
    if (!hasMoreUserMatches || loadingUserMatches) return;
    matchesActions
      .fetchUserMatches(
        { page: userMatchesPage.page + 1, size: PAGE_SIZE },
        { append: true }
      )
      .catch(() => undefined);
  }, [hasMoreUserMatches, loadingUserMatches, matchesActions, userMatchesPage.page]);

  const handleStartChat = useCallback(async () => {
    if (!selectedMatch) return;
    setStartingChat(true);
    try {
      const conversation = await chatActions.createConversation({
        otherUserId: selectedMatch.userId,
      });
      router.push(`/chat/${conversation.id}`);
    } catch (e) {
      // l'errore è già gestito dallo store; qui evitiamo crash
    } finally {
      setStartingChat(false);
    }
  }, [chatActions, router, selectedMatch]);

  const isInitialLoading = loadingUserMatches && userMatches.length === 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
            Matchmaking
          </p>
          <h1 className="text-3xl font-semibold text-foreground">Le tue compatibilita</h1>
          <p className="text-sm text-muted">
            Suggerimenti basati sugli interessi condivisi e sul tuo profilo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={loadingUserMatches}>
            Aggiorna
          </Button>
          <Button
            size="sm"
            onClick={handleLoadMore}
            disabled={!hasMoreUserMatches || loadingUserMatches}
          >
            Carica altri
          </Button>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr,1fr]">
        <div className="space-y-4">
          <MatchFilterBar
            searchValue={search}
            onSearchChange={setSearch}
            sortOptions={MATCH_SORT_OPTIONS}
            sortValue={sortValue}
            onSortChange={setSortValue}
            subtitle="Filtra i risultati o cambia l'ordinamento."
          />

          {isInitialLoading && (
            <Card className="flex items-center gap-3 p-5">
              <Loader size="sm" />
              <p className="text-sm text-muted">Caricamento match...</p>
            </Card>
          )}

          {error && !isInitialLoading && (
            <div className="space-y-3">
              <ErrorState
                title="Impossibile caricare i match"
                description={error.message}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => matchesActions.fetchUserMatches({ size: PAGE_SIZE }).catch(() => undefined)}
                disabled={loadingUserMatches}
              >
                Riprova
              </Button>
            </div>
          )}

          {!isInitialLoading && !error && filteredMatches.length === 0 && (
            <EmptyState
              title="Nessun match disponibile"
              description="Completa gli interessi o i test per generare nuovi suggerimenti."
            />
          )}

          <div className="space-y-3">
            {filteredMatches.map((match) => (
              <MatchListItem
                key={match.matchId}
                match={match}
                selected={selectedMatch?.matchId === match.matchId}
                onSelectMatch={setSelectedMatchId}
              />
            ))}
          </div>

          {hasMoreUserMatches && !loadingUserMatches && filteredMatches.length > 0 ? (
            <div className="flex justify-center">
              <Button variant="secondary" onClick={handleLoadMore}>
                Mostra altri
              </Button>
            </div>
          ) : null}
        </div>

        <aside className="space-y-3">
          {selectedMatch ? (
            <MatchDetailPanel
              name={getDisplayName(selectedMatch)}
              location={getLocation(selectedMatch)}
              matchScore={selectedMatch.scoreTotal ?? 0}
              bio={selectedMatch.explanation ?? undefined}
              tags={mapTags(selectedMatch)}
              insights={mapInsights(selectedMatch)}
              primaryActionLabel="Inizia chat"
              onPrimaryAction={handleStartChat}
              primaryActionDisabled={startingChat || loadingConversations}
              secondaryActionLabel="Aggiorna match"
              onSecondaryAction={handleRefresh}
            />
          ) : (
            <Card className="p-5">
              <p className="text-sm font-semibold text-foreground">
                Seleziona un match per vedere i dettagli
              </p>
              <p className="text-sm text-muted">
                Qui troverai spiegazioni e azioni rapide per contattare l&apos;utente.
              </p>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
};
