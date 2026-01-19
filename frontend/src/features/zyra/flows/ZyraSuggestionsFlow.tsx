"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { ZyraMatchOfDayCard } from "@/features/zyra/cards/ZyraMatchOfDayCard";
import { cx } from "@/lib/classNames";
import { useZyra } from "@/hooks";
import type { ZyraSuggestionResponse } from "@/types/zyra";

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const getSuggestionTitle = (suggestion: ZyraSuggestionResponse) => {
  switch (suggestion.suggestionType) {
    case "MATCH_OF_THE_DAY":
      return "Match del giorno";
    case "PLACE_RECOMMENDATION":
      return "Luoghi per te";
    case "USER_RECOMMENDATION":
      return "Persone affini";
    default:
      return "Suggerimento";
  }
};

const getSuggestionMessage = (suggestion: ZyraSuggestionResponse) => {
  if (suggestion.payload && typeof suggestion.payload.message === "string") {
    return suggestion.payload.message;
  }
  return "Suggerimento generato da Zyra.";
};

const getAction = (suggestion: ZyraSuggestionResponse) => {
  switch (suggestion.suggestionType) {
    case "MATCH_OF_THE_DAY":
      return { label: "Vai ai match", href: "/matches" };
    case "PLACE_RECOMMENDATION":
      return { label: "Apri mappa", href: "/map" };
    case "USER_RECOMMENDATION":
      return { label: "Scopri persone", href: "/matches" };
    default:
      return null;
  }
};

export const ZyraSuggestionsFlow = () => {
  const { suggestions, loadingSuggestions, error, actions } = useZyra();

  useEffect(() => {
    actions.fetchSuggestions({ size: 20 }).catch(() => undefined);
  }, [actions]);

  const hasData = suggestions.length > 0;

  return (
    <Card className="space-y-4 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
          Suggerimenti Zyra
        </p>
        <h2 className="text-xl font-semibold text-foreground">
          Ultime raccomandazioni
        </h2>
      </div>

      {loadingSuggestions && !hasData ? (
        <div className="flex items-center gap-3 text-sm text-muted">
          <Loader size="sm" />
          <span>Caricamento suggerimenti...</span>
        </div>
      ) : null}

      {error && !hasData ? (
        <ErrorState
          title="Impossibile caricare i suggerimenti"
          description={error.message}
        />
      ) : null}

      {!loadingSuggestions && !error && !hasData ? (
        <EmptyState
          title="Nessun suggerimento"
          description="Genera un suggerimento da Zyra per vedere i risultati qui."
        />
      ) : null}

      {hasData ? (
        <div className="space-y-3">
          {suggestions.map((suggestion) => {
            const action = getAction(suggestion);
            const message = getSuggestionMessage(suggestion);
            const context =
              suggestion.payload && typeof suggestion.payload.context === "string"
                ? suggestion.payload.context
                : null;

            if (suggestion.suggestionType === "MATCH_OF_THE_DAY") {
              return (
                <ZyraMatchOfDayCard
                  key={suggestion.id}
                  title="Match del giorno"
                  description={message}
                  actionHref={action?.href}
                  actionLabel={action?.label ?? "Apri"}
                  className="border border-zyra-border/60 bg-zyra-glow/40"
                />
              );
            }

            return (
              <div
                key={suggestion.id}
                className={cx(
                  "rounded-[var(--radius-md)] border border-border/60 bg-surface p-3"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      {getSuggestionTitle(suggestion)}
                    </p>
                    <p className="text-sm text-muted">{message}</p>
                    {context ? (
                      <p className="text-xs text-subtle">Contesto: {context}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-[11px] uppercase tracking-wide text-subtle">
                    {suggestion.suggestionType.replaceAll("_", " ")}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-subtle">
                  <span>{formatDateTime(suggestion.createdAt)}</span>
                  {action ? (
                    <Link href={action.href} className="text-zyra-text hover:underline">
                      {action.label}
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </Card>
  );
};
