"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Loader } from "@/components/elements/Loader";
import { AdminStatCard } from "@/features/admin/cards/AdminStatCard";
import { KpiChartCard } from "@/features/admin/cards/KpiChartCard";
import { KpiRangeSelector } from "@/features/admin/elements/KpiRangeSelector";
import { formatDuration, formatNumber } from "@/features/admin/lib/formatters";
import { buildTrend, lastSeriesValue, sumSeries, toChartPoints } from "@/features/admin/lib/kpis";
import { AdminPageHeader } from "@/features/admin/sections/AdminPageHeader";
import { getKpis, refreshKpis } from "@/services/admin";
import type { ApiError } from "@/types/api";
import type { AnalyticsKpiParams, AnalyticsKpiResponse } from "@/types/analytics";

const RANGE_ITEMS = [
  { id: "7d", label: "7 days", days: 7 },
  { id: "30d", label: "30 days", days: 30 },
  { id: "90d", label: "90 days", days: 90 },
] as const;

const trendToTone = (trend: "up" | "down" | "neutral") => {
  if (trend === "up") return "success" as const;
  if (trend === "down") return "danger" as const;
  return "neutral" as const;
};

const toIsoDate = (value: Date) => value.toISOString().slice(0, 10);

const buildRangeParams = (days: number): AnalyticsKpiParams => {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));

  return {
    from: toIsoDate(start),
    to: toIsoDate(end),
  };
};

export const AdminAnalyticsOverview = () => {
  const [selectedRangeId, setSelectedRangeId] = useState<string>("30d");
  const [kpis, setKpis] = useState<AnalyticsKpiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const selectedRange = useMemo(
    () => RANGE_ITEMS.find((item) => item.id === selectedRangeId) ?? RANGE_ITEMS[1],
    [selectedRangeId]
  );

  const params = useMemo(
    () => buildRangeParams(selectedRange.days),
    [selectedRange.days]
  );

  const loadKpis = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getKpis(params);
      setKpis(response);
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    void loadKpis();
  }, [loadKpis]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);

    try {
      await refreshKpis(params);
      const response = await getKpis(params);
      setKpis(response);
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setRefreshing(false);
    }
  };

  const analytics = useMemo(() => {
    const registrations = sumSeries(kpis?.registrationsDaily);
    const onboardingCompleted = sumSeries(kpis?.onboardingCompletedDaily);
    const mapOpened = sumSeries(kpis?.mapOpenedDaily);
    const profileViewed = sumSeries(kpis?.profileViewedDaily);
    const matchOpened = sumSeries(kpis?.matchSectionOpenedDaily);

    return {
      registrations,
      onboardingCompleted,
      mapOpened,
      profileViewed,
      matchOpened,
      dau: lastSeriesValue(kpis?.activeUsersDaily),
      wau: lastSeriesValue(kpis?.activeUsersWeekly),
      returningUsers: kpis?.returningUsers ?? 0,
      avgSessionDuration: kpis?.averageSessionDurationSeconds ?? 0,
      registrationsTrend: buildTrend(kpis?.registrationsDaily),
      onboardingTrend: buildTrend(kpis?.onboardingCompletedDaily),
      activeUsersTrend: buildTrend(kpis?.activeUsersDaily),
      mapTrend: buildTrend(kpis?.mapOpenedDaily),
      profileTrend: buildTrend(kpis?.profileViewedDaily),
      matchTrend: buildTrend(kpis?.matchSectionOpenedDaily),
      registrationsChart: toChartPoints(kpis?.registrationsDaily),
      onboardingChart: toChartPoints(kpis?.onboardingCompletedDaily),
      activeUsersChart: toChartPoints(kpis?.activeUsersDaily),
      mapChart: toChartPoints(kpis?.mapOpenedDaily),
      profileChart: toChartPoints(kpis?.profileViewedDaily),
      matchChart: toChartPoints(kpis?.matchSectionOpenedDaily),
    };
  }, [kpis]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Analytics overview"
        subtitle="Key KPIs, trends, and usage signals for the selected range."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            loading={refreshing}
            loadingText="Refreshing"
          >
            Refresh KPIs
          </Button>
        }
      />

      <KpiRangeSelector
        ranges={RANGE_ITEMS.map((item) => ({ id: item.id, label: item.label }))}
        selectedId={selectedRangeId}
        onRangeSelect={setSelectedRangeId}
      />

      {loading ? (
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">Loading analytics KPIs...</p>
        </Card>
      ) : null}

      {error ? (
        <Card className="space-y-3 border-danger/30 p-5">
          <p className="text-sm font-semibold text-danger">Unable to load KPIs</p>
          <p className="text-sm text-muted">{error.message}</p>
          <Button size="sm" variant="outline" onClick={() => void loadKpis()}>
            Try again
          </Button>
        </Card>
      ) : null}

      {!loading && !error ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard
              label="Registrations"
              value={formatNumber(analytics.registrations)}
              trend={analytics.registrationsTrend.direction}
              trendLabel={analytics.registrationsTrend.label}
            />
            <AdminStatCard
              label="Onboarding completed"
              value={formatNumber(analytics.onboardingCompleted)}
              trend={analytics.onboardingTrend.direction}
              trendLabel={analytics.onboardingTrend.label}
            />
            <AdminStatCard
              label="Daily active users"
              value={formatNumber(analytics.dau)}
              trend={analytics.activeUsersTrend.direction}
              trendLabel={analytics.activeUsersTrend.label}
            />
            <AdminStatCard
              label="Average session duration"
              value={formatDuration(analytics.avgSessionDuration)}
              trend="neutral"
              trendLabel="Period average"
            />
            <AdminStatCard
              label="Weekly active users"
              value={formatNumber(analytics.wau)}
              trend="neutral"
              trendLabel="Latest available bucket"
            />
            <AdminStatCard
              label="Returning users"
              value={formatNumber(analytics.returningUsers)}
              trend="neutral"
              trendLabel="Latest weekly window"
            />
            <AdminStatCard
              label="Match section opened"
              value={formatNumber(analytics.matchOpened)}
              trend={analytics.matchTrend.direction}
              trendLabel={analytics.matchTrend.label}
            />
            <AdminStatCard
              label="Map opened"
              value={formatNumber(analytics.mapOpened)}
              trend={analytics.mapTrend.direction}
              trendLabel={analytics.mapTrend.label}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <KpiChartCard
              title="Registrations"
              subtitle="Daily series"
              value={formatNumber(analytics.registrations)}
              deltaLabel={analytics.registrationsTrend.label}
              deltaTone={trendToTone(analytics.registrationsTrend.direction)}
              dataPoints={analytics.registrationsChart}
            />
            <KpiChartCard
              title="Onboarding completed"
              subtitle="Daily series"
              value={formatNumber(analytics.onboardingCompleted)}
              deltaLabel={analytics.onboardingTrend.label}
              deltaTone={trendToTone(analytics.onboardingTrend.direction)}
              dataPoints={analytics.onboardingChart}
            />
            <KpiChartCard
              title="Active users (DAU)"
              subtitle="Daily series"
              value={formatNumber(analytics.dau)}
              deltaLabel={analytics.activeUsersTrend.label}
              deltaTone={trendToTone(analytics.activeUsersTrend.direction)}
              dataPoints={analytics.activeUsersChart}
            />
            <KpiChartCard
              title="Match section opened"
              subtitle="Daily series"
              value={formatNumber(analytics.matchOpened)}
              deltaLabel={analytics.matchTrend.label}
              deltaTone={trendToTone(analytics.matchTrend.direction)}
              dataPoints={analytics.matchChart}
            />
            <KpiChartCard
              title="Profile viewed"
              subtitle="Daily series"
              value={formatNumber(analytics.profileViewed)}
              deltaLabel={analytics.profileTrend.label}
              deltaTone={trendToTone(analytics.profileTrend.direction)}
              dataPoints={analytics.profileChart}
            />
            <KpiChartCard
              title="Map opened"
              subtitle="Daily series"
              value={formatNumber(analytics.mapOpened)}
              deltaLabel={analytics.mapTrend.label}
              deltaTone={trendToTone(analytics.mapTrend.direction)}
              dataPoints={analytics.mapChart}
            />
          </div>
        </>
      ) : null}
    </div>
  );
};
