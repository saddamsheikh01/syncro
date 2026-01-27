"use client";

import { useEffect, useMemo, useRef } from "react";
import { Card } from "@/components/elements/Card";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { MapTestListItem } from "@/features/tests/lists/MapTestListItem";
import { TestsHelperCard } from "@/features/tests/cards/TestsHelperCard";
import { useTests } from "@/hooks";

export const TestsOverview = () => {
  const { tests, loading, error, completedCount, countLoading, actions } =
    useTests();
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    actions.fetchTests().catch(() => undefined);
    actions.fetchCompletedCount().catch(() => undefined);
  }, [actions]);

  const testItems = useMemo(
    () =>
      tests.map((test) => ({
        title: test.title,
        description: test.description ?? undefined,
        href: `/tests/${test.id}`,
        statusLabel: "Micro-test",
        actionLabel: "Inizia",
      })),
    [tests]
  );

  const isInitialLoading = loading && tests.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
          Profilazione Zyra
        </p>
        <h1 className="text-3xl font-semibold text-foreground">
          Micro-test personalizzati
        </h1>
        <p className="text-sm text-muted">
          Rispondi a brevi test per aggiornare il tuo profilo e ricevere
          suggerimenti piu pertinenti da Zyra.
        </p>
      </header>

      <TestsHelperCard
        completedCount={completedCount}
        totalTests={tests.length}
        loading={countLoading && completedCount == null}
      />

      {isInitialLoading ? (
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">Caricamento micro-test...</p>
        </Card>
      ) : null}

      {error ? (
        <ErrorState
          title="Impossibile caricare i micro-test"
          description={error.message}
        />
      ) : null}

      {!isInitialLoading && !error && tests.length === 0 ? (
        <EmptyState
          title="Nessun micro-test disponibile"
          description="Torna piu tardi per nuovi test di profilazione."
        />
      ) : null}

      {tests.length ? <MapTestListItem items={testItems} /> : null}
    </div>
  );
};
