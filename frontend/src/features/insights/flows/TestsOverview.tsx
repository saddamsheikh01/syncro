"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { MapTestListItem } from "@/features/insights/lists/MapTestListItem";
import { TestsHelperCard } from "@/features/insights/cards/TestsHelperCard";
import { InsightsDbLanguageDisclaimer } from "@/features/insights/elements/InsightsDbLanguageDisclaimer";
import { SectionHeader } from "@/features/home/sections/SectionHeader";
import { ZyraMark } from "@/features/zyra/elements/ZyraMark";
import { useAnalytics, useT, useTests, useUser } from "@/hooks";

const isLocalhost = () =>
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

const ASTRO_INSIGHT_SLUG = "astrology";

export const TestsOverview = () => {
  const { t, locale } = useT();
  const { tests, loading, error, completedCount, countLoading, actions } =
    useTests();
  const { profile } = useUser();
  const { actions: analyticsActions } = useAnalytics();
  const loadedLocaleRef = useRef<string | null>(null);
  const analyticsTrackedRef = useRef(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (loadedLocaleRef.current === locale) return;
    loadedLocaleRef.current = locale;
    actions.fetchTests().catch(() => undefined);
    actions.fetchCompletedCount().catch(() => undefined);
  }, [actions, locale]);

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

  const astrologyCompleted =
    profile?.hasBirthChart ?? Boolean(profile?.zyraBirthChartInterpretation);

  const testItems = useMemo(
    () => {
      const fromApi = tests.map((test) => ({
        testType: test.testType,
        title: test.title,
        description: test.description ?? undefined,
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
        actionLabel: t("View Insights"),
        completed: test.completed,
      }));
      const birthChartItem = {
        testType: "ASTRO" as const,
        title: t("Birth chart"),
        description: t("Used for compatibility. Add place and optional time for better accuracy."),
        href: `/insights/${ASTRO_INSIGHT_SLUG}`,
        onOpen: () => {
          void analyticsActions.trackEvent({
            eventName: "INSIGHT_OPENED_FROM_LIST",
            payload: {
              testId: ASTRO_INSIGHT_SLUG,
              testType: "ASTRO",
              completed: astrologyCompleted,
            },
          });
        },
        actionLabel: t("View Insights"),
        completed: astrologyCompleted,
      };
      return [...fromApi, birthChartItem];
    },
    [analyticsActions, astrologyCompleted, t, tests]
  );

  const totalInsightsCount = tests.length + 1;

  const isInitialLoading = loading && tests.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-12">
      <div className="grid gap-4 lg:grid-cols-[1.6fr,1fr]">
        <TestsHelperCard
          completedCount={completedCount}
          totalTests={totalInsightsCount}
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
                {t("Clear signals lead to better matches.")}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted">
            {t("The more you answer, the fewer mismatches you get.")}
          </p>
          <div className="text-xs text-subtle">
            {t("— Zyra")}
          </div>
        </Card>
      </div>

      {isLocalhost() ? (
        <Card className="flex items-center justify-between gap-3 border-dashed border-amber-500/50 bg-amber-500/5 p-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-600">
              {t("Debug Mode")}
            </p>
            <p className="text-xs text-muted">
              {t("Reset your submissions to retake tests.")}
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleResetSubmissions}
            loading={resetting}
            loadingText={t("Resetting...")}
          >
            {t("Reset insights")}
          </Button>
        </Card>
      ) : null}

      <SectionHeader
        title={t("Improve Your Matches")}
        subtitle={t("Your progress drives more precise results.")}
      />

      <InsightsDbLanguageDisclaimer />

      {isInitialLoading ? (
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">{t("Loading insights...")}</p>
        </Card>
      ) : null}

      {error ? (
        <ErrorState
          title={t("Unable to load insights")}
          description={error.message}
        />
      ) : null}

      {!isInitialLoading && !error && testItems.length === 0 ? (
        <EmptyState
          title={t("No insights available")}
          description={t("Check back later for new profiling insights.")}
        />
      ) : null}

      {testItems.length > 0 ? (
        <Card className="p-5">
          <MapTestListItem items={testItems} />
        </Card>
      ) : null}
    </div>
  );
};
