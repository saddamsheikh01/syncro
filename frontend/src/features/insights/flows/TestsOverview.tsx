"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { MapTestListItem } from "@/features/insights/lists/MapTestListItem";
import { TestsHelperCard } from "@/features/insights/cards/TestsHelperCard";
import { SectionHeader } from "@/features/home/sections/SectionHeader";
import { ZyraMark } from "@/features/zyra/elements/ZyraMark";
import { useAnalytics, useTests } from "@/hooks";
import { resolveTestCopy } from "@/lib/insightsCopy";

const isLocalhost = () =>
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

export const TestsOverview = () => {
  const { tests, loading, error, completedCount, countLoading, actions } =
    useTests();
  const { actions: analyticsActions } = useAnalytics();
  const bootstrappedRef = useRef(false);
  const analyticsTrackedRef = useRef(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    actions.fetchTests().catch(() => undefined);
    actions.fetchCompletedCount().catch(() => undefined);
  }, [actions]);

  useEffect(() => {
    if (analyticsTrackedRef.current) return;
    analyticsTrackedRef.current = true;
    void analyticsActions.trackEvent({
      eventName: "INSIGHTS_OVERVIEW_OPENED",
      payload: {
        route: "/insights",
      },
    });
  }, [analyticsActions]);

  const handleResetSubmissions = async () => {
    if (resetting) return;
    setResetting(true);
    try {
      await actions.resetSubmissions();
      await actions.fetchTests();
      await actions.fetchCompletedCount();
      void analyticsActions.trackEvent({
        eventName: "INSIGHTS_RESET_ALL_SUBMISSIONS",
      });
    } catch {
      // gestito dallo store
    } finally {
      setResetting(false);
    }
  };

  const testItems = useMemo(
    () =>
      tests.map((test) => {
        const localized = resolveTestCopy({
          title: test.title,
          description: test.description,
          testType: test.testType,
        });

        return {
          testType: test.testType,
          title: localized.title,
          description: localized.description,
          href: `/insights/${test.id}`,
          onOpen: () => {
            void analyticsActions.trackEvent({
              eventName: "INSIGHT_OPENED_FROM_LIST",
              payload: {
                testId: test.id,
                testType: test.testType,
                completed: test.completed,
              },
            });
          },
          actionLabel: "View Insights",
          completed: test.completed,
        };
      }),
    [analyticsActions, tests]
  );

  const isInitialLoading = loading && tests.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-12">
      <div className="grid gap-4 lg:grid-cols-[1.6fr,1fr]">
        <TestsHelperCard
          completedCount={completedCount}
          totalTests={tests.length}
          loading={countLoading && completedCount == null}
        />
        <Card className="flex flex-col justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zyra-glow/40">
              <ZyraMark size="sm" glow={false} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Zyra
              </p>
              <p className="text-xs text-muted">
                Clear signals lead to better matches.
              </p>
            </div>
          </div>
          <p className="text-sm text-muted">
            The more you answer, the fewer mismatches you get.
          </p>
          <div className="text-xs text-subtle">
            — Zyra
          </div>
        </Card>
      </div>

      {isLocalhost() ? (
        <Card className="flex items-center justify-between gap-3 border-dashed border-amber-500/50 bg-amber-500/5 p-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-600">Debug Mode</p>
            <p className="text-xs text-muted">
              Reset your submissions to retake tests.
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleResetSubmissions}
            loading={resetting}
            loadingText="Resetting..."
          >
            Reset insights
          </Button>
        </Card>
      ) : null}

      <SectionHeader
        title="Improve Your Matches"
        subtitle="Your progress drives more precise results."
      />

      {isInitialLoading ? (
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">Loading insights...</p>
        </Card>
      ) : null}

      {error ? (
        <ErrorState
          title="Unable to load insights"
          description={error.message}
        />
      ) : null}

      {!isInitialLoading && !error && tests.length === 0 ? (
        <EmptyState
          title="No insights available"
          description="Check back later for new profiling insights."
        />
      ) : null}

      {tests.length ? (
        <Card className="p-5">
          <MapTestListItem items={testItems} />
        </Card>
      ) : null}
    </div>
  );
};
